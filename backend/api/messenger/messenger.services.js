const messengerController = require("./messenger.controller");

const VERIFY_TOKEN = "test";

var Mess = require("./messenger.model");
/*
 * Webhook Verification GET
 */
function handleVerifyServer(req, res) {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
}

/*
 * Webhook POST handler
 */
async function handleWebhookEvent(req, res) {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function (entry) {
      const webhook_event = entry.messaging[0];

      const sender_psid = webhook_event.sender.id;

      const mess = Mess.findOne({ userId: sender_psid });

      if (mess) {
        if (webhook_event.message) {
          if (mess.loop == 0) {
            if (mess.admin == 1) messengerController.handleMessage(sender_psid, webhook_event.message);
            else if (webhook_event.message.text == "login") messengerController.handleLogin(sender_psid);
          } else if (webhook_event.message.text == "exit")
            messengerController.handleUserMessage(sender_psid, webhook_event.message.text);
          else messengerController.handleLoopMessage(sender_psid, webhook_event.message);
        } else if (webhook_event.postback) {
          messengerController.handlePostback(sender_psid, webhook_event.postback);
        }
        return ;
      } 
        if (webhook_event.message) {
          // Neu truoc do chua dang nhap lan nao
          if (webhook_event.message.text == "login") {
            const mess = new Mess({
              userId: sender_psid,
              loop: 0,
            });
            mess.save(function (err) {
              if (err) return console.log(err);
            });
            messengerController.handleLogin(sender_psid);
          } else {
            messengerController.handleUserMessage(sender_psid, webhook_event.message.text);
          }
        } else if (webhook_event.postback) {
          messengerController.handleUserMessage(sender_psid, webhook_event.postback.payload);
        }
      

      res.status(200).send("EVENT_RECEIVED");
    });
  } else {
    res.sendStatus(404);
  }
}

module.exports = {
  handleVerifyServer: handleVerifyServer,
  handleWebhookEvent: handleWebhookEvent,
};