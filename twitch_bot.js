//Referenced from https://dev.twitch.tv/docs/chat/chatbot-guide/
import "dotenv/config";
import WebSocket from "ws";
import Requests from "./requests.js";

const request_helper = new Requests();

const BOT_USER_ID = "960074192";
const OAUTH_TOKEN = process.env.twitch_token;
const CLIENT_ID = process.env.twitch_client_id;
const CHAT_CHANNEL_USER_ID = "61362118";
const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
var websocketSessionID;

class TwitchBot {
  async run() {
    await this.getAuth();
    this.startWebSocketClient();
  }

  async getAuth() {
    let response = await fetch("https://id.twitch.tv/oauth2/validate", {
      method: "GET",
      headers: {
        Authorization: "OAuth " + OAUTH_TOKEN,
      },
    });

    //git
    if (response.status != 200) {
      let data = await response.json();
      console.error(
        "Token is not valid. /oauth2/validate returned status code " +
          response.status,
      );
      console.error(data);
      process.exit(1);
    }
    console.log(response);
    console.log("Validated token.");
  }

  startWebSocketClient() {
    let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);
    websocketClient.on("error", console.error);
    websocketClient.on("open", () => {
      console.log("WebSocket connection opened to " + EVENTSUB_WEBSOCKET_URL);
    });
    websocketClient.on("message", (data) => {
      this.handleWebSocketMessage(JSON.parse(data.toString()));
    });
    return websocketClient;
  }

  async handleWebSocketMessage(data) {
    switch (data.metadata.message_type) {
      case "session_welcome":
        websocketSessionID = data.payload.session.id;
        this.registerEventSubListeners();
        break;
      case "notification":
        switch (data.metadata.subscription_type) {
          case "channel.chat.message":
            console.log(
              `MSG #${data.payload.event.broadcaster_user_login} <${data.payload.event.chatter_user_login}> ${data.payload.event.message.text}`,
            );
            let chat_message = data.payload.event.message.text.trim();

            if (Array.from(chat_message)[0] === "!") {
              let chat_command = chat_message
                .match(/^\s*(\S+)\s*(.*?)\s*$/)
                .slice(1);
              if (Array.from(chat_command[1]).length === 0) {
                switch (chat_command[0]) {
                  case "!song":
                    this.sendChatMessage(await request_helper.now_playing());
                    break;
                  case "!skip":
                    this.sendChatMessage(await request_helper.skip_song());
                    break;
                }
              } else {
                switch (chat_command[0]) {
                  case "!songrequest":
                    this.sendChatMessage(
                      await request_helper.song_request(chat_command[1]),
                    );
                }
              }
            }

            //for (const command of Object.keys(this.commands)) {
            //  if (chat_message.includes(command)) {
            //      this.sendChatMessage(this.commands[command]);
            //  }
            //}

            break;
        }
        break;
    }
  }

  async sendChatMessage(chatMessage) {
    console.log("sendChatMessage");
    let response = await fetch("https://api.twitch.tv/helix/chat/messages", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + OAUTH_TOKEN,
        "Client-Id": CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        broadcaster_id: CHAT_CHANNEL_USER_ID,
        sender_id: BOT_USER_ID,
        message: chatMessage,
      }),
    });

    if (response.status != 200) {
      let data = await response.json();
      console.error("Failed to send chat message");
      console.error(data);
    } else {
      console.log("Sent chat message: " + chatMessage);
    }
  }

  async registerEventSubListeners() {
    console.log(CHAT_CHANNEL_USER_ID);
    console.log("registerEventSubListeners");
    let response = await fetch(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + OAUTH_TOKEN,
          "Client-Id": CLIENT_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "channel.chat.message",
          version: "1",
          condition: {
            broadcaster_user_id: CHAT_CHANNEL_USER_ID,
            user_id: BOT_USER_ID,
          },
          transport: {
            method: "websocket",
            session_id: websocketSessionID,
          },
        }),
      },
    );

    if (response.status != 202) {
      let data = await response.json();
      console.error(
        "Failed to subscribe to channel.chat.message. API call returned status code " +
          response.status,
      );
      console.error(data);
      process.exit(1);
    } else {
      const data = await response.json();
      console.log(`Subscribed to channel.chat.message [${data.data[0].id}]`);
    }
  }
}

export default TwitchBot;
