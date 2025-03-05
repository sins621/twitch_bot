import WebSocket from "ws";

const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
const SPOTIFY_ENDPOINT = "https://www.sins621.com/api/spotify";
const TWITCH_REFRESH_ENDPOINT = "https://id.twitch.tv/oauth2/token";
const TWITCH_TOKEN_ENDPOINT = "https://id.twitch.tv/oauth2/validate";
const TWITCH_SUB_EVENT_ENDPOINT =
  "https://api.twitch.tv/helix/eventsub/subscriptions";

export default class TwitchBot {
  constructor(
    authToken,
    refreshToken,
    clientID,
    clientSecret,
    botUserID,
    channelUserID
  ) {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
    this.websocketClient = null;
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.botUserID = botUserID;
    this.channelUserID = channelUserID;
  }

  async validateToken() {
    console.log("Validating token.");
    const RESPONSE = await fetch(TWITCH_TOKEN_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: "OAuth " + this.authToken,
      },
    });

    const DATA = await RESPONSE.json();
    if (RESPONSE.status !== 200)
      throw new Error(this.toTitleCase(DATA.message));

    console.log("Token validated.");
  }

  toTitleCase(str) {
    if (!str) {
      return "";
    }
    return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }

  initializeWebsocket() {
    console.log("Attempting websocket connection.");
    this.websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);
    this.websocketClient.on("error", console.error);
    this.websocketClient.on("open", () => console.log("Websocket connected."));
    this.websocketClient.on("message", (data) =>
      this.handleWebSocketMessage(data)
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
    console.log("Attempting to subscribe to chat.");
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
    const RESPONSE = await fetch(TWITCH_SUB_EVENT_ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: BODY,
    });
    const DATA = await RESPONSE.json();
    if (DATA.error)
      throw new Error(
        `Error subscribing to Twitch chat, Twitch error: ${this.toTitleCase(
          DATA.message
        )}`
      );
    console.log("Successfully subscribed to twitch chat.");
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
        `Now playing ${data.song_name} by ${data.artists.join(", ")}.`
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
              `${index + 1}. ${song.song_name} by ${song.artists.join(", ")}`
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
        `${SPOTIFY_ENDPOINT}/search?` + new URLSearchParams({ q: query })
      );
      const data = await response.json();
      this.sendChatMessage(
        `Added ${data.song_name} by ${data.artists.join(", ")} to the queue.`
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

  async revalidateToken() {
    console.log("Re-validating token.");
    const PARAMS = new URLSearchParams({
      client_id: this.clientID,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });

    const response = await fetch(TWITCH_REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: PARAMS,
    });

    const DATA = await response.json();
    if (!DATA.access_token) throw new Error(this.toTitleCase(DATA.message));

    this.authToken = DATA.access_token;
    this.refreshToken = DATA.refresh_token;
    console.log("Token re-validated.");
  }
}
