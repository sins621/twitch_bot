import WebSocket from "ws";

const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
const SPOTIFY_ENDPOINT = "https://www.sins621.com/api/spotify";

export default class TwitchBot {
  constructor(authToken, refreshToken, clientID, botUserID, channelUserID) {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
    this.websocketClient = null;
    this.clientID = clientID;
    this.botUserID = botUserID;
    this.channelUserID = channelUserID;
  }

  async start() {
    try {
      await this.validateToken();
      this.initializeWebsocket();
    } catch (err) {
      if (err.message === "Invalid Access Token") {
        // Start TokenGenerator
        process.exit();
      }
    }
  }

  async validateToken() {
    console.log("Validating Token");
    const RESPONSE = await fetch("https://id.twitch.tv/oauth2/validate", {
      method: "GET",
      headers: {
        Authorization: "OAuth " + this.authToken,
      },
    });

    const DATA = await RESPONSE.json();
    if (RESPONSE.status !== 200) {
      throw new Error(this.toTitleCase(DATA.message));
    }

    console.log("Token Validated");
  }

  toTitleCase(str) {
    if (!str) {
      return "";
    }
    return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }

  initializeWebsocket() {
    console.log("Attempting Websocket Connection");
    this.websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);
    this.websocketClient.on("error", console.error);
    this.websocketClient.on("open", () => console.log("WebSocket connected."));
    this.websocketClient.on("message", (data) =>
      this.handleWebSocketMessage(data),
    );
  }

  async handleWebSocketMessage(data) {
    const socketData = JSON.parse(data.toString());
    const messageType = socketData.metadata.message_type;
    if (messageType === "session_welcome") {
      await this.registerEventSub(socketData.payload.session.id);
    } else if (messageType === "notification") {
      this.handleChatMessage(socketData);
    }
  }

  async registerEventSub(sessionID) {
    console.log("Attempting to Subscribe to Chat");
    const HEADERS = {
      Authorization: `Bearer ${this.authToken}`,
      "Client-Id": this.clientID,
      "Content-Type": "application/json",
    };
    const BODY = JSON.stringify({
      type: "channel.chat.message",
      version: "1",
      condition: {
        broadcaster_user_id: this.channelUserID,
        user_id: this.botUserID,
      },
      transport: {
        method: "websocket",
        session_id: sessionID,
      },
    });
    const RESPONSE = await fetch(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        method: "POST",
        headers: HEADERS,
        body: BODY,
      },
    );
    const DATA = await RESPONSE.json();
    if (DATA.error)
      throw new Error(
        `Error subscribing to Twitch chat, Twitch error: ${this.toTitleCase(DATA.message)}`,
      );
    console.log("Successfully Subscribed to Twitch Chat");
  }

  async handleChatMessage(socketData) {
    const subscription_type = socketData.metadata.subscription_type;
    const payload = socketData.payload;

    if (subscription_type === "channel.chat.message") {
      const sender = payload.event.chatter_user_login;
      const chatMessage = payload.event.message.text.trim();
      console.log(`${sender}: ${chatMessage}`);

      if (chatMessage.startsWith("!")) {
        const [command, ...args] = chatMessage.split(" ");
        await this.executeChatCommand(command, args.join(" "));
      }
    }
  }

  async executeChatCommand(command, args) {
    switch (command) {
      case "!song":
        await this.getCurrentSong();
        break;
      case "!queue":
        await this.getQueue();
        break;
      case "!skip":
        await this.skipSong();
        break;
      case "!songrequest":
        await this.requestSong(args);
        break;
    }
  }

  async getCurrentSong() {
    try {
      const response = await fetch(`${SPOTIFY_ENDPOINT}/playing`);
      if (response.status === 204)
        return this.sendChatMessage("No song is currently playing");

      const data = await response.json();
      this.sendChatMessage(
        `Now playing ${data.song_name} by ${data.artists.join(", ")}.`,
      );
    } catch (err) {
      console.error(err);
    }
  }

  async getQueue() {
    try {
      const response = await fetch(`${SPOTIFY_ENDPOINT}/queue`);
      const data = await response.json();
      if (response.status === 204 || data.length === 0) {
        return this.sendChatMessage("No songs are currently in queue");
      }
      const message =
        data
          .map(
            (song, index) =>
              `${index + 1}. ${song.song_name} by ${song.artists.join(", ")}`,
          )
          .join(", ") + ".";
      this.sendChatMessage(message);
    } catch (err) {
      console.error(err);
    }
  }

  async skipSong() {
    try {
      await fetch(`${SPOTIFY_ENDPOINT}/skip`);
      this.sendChatMessage("Song skipped");
    } catch (err) {
      console.error(err);
    }
  }

  async requestSong(query) {
    try {
      const response = await fetch(
        `${SPOTIFY_ENDPOINT}/search?` + new URLSearchParams({ q: query }),
      );
      const data = await response.json();
      this.sendChatMessage(
        `Added ${data.song_name} by ${data.artists.join(", ")} to the queue.`,
      );
    } catch (err) {
      console.error(err);
    }
  }

  async sendChatMessage(chatMessage) {
    try {
      const HEADERS = {
        Authorization: `Bearer ${this.authToken}`,
        "Client-Id": this.clientID,
        "Content-Type": "application/json",
      };
      const BODY = JSON.stringify({
        broadcaster_id: this.channelUserID,
        sender_id: this.botUserID,
        message: chatMessage,
      });
      await fetch("https://api.twitch.tv/helix/chat/messages", {
        method: "POST",
        headers: HEADERS,
        body: BODY,
      });
      console.log("Sent chat message: ", chatMessage);
    } catch (err) {
      console.error("Failed to send chat message", err);
    }
  }
}
