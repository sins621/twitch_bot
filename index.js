import express from "express";
import axios from "axios";
import fs from "node:fs/promises";
import morgan from "morgan";
import "dotenv/config";
import WebSocket from "ws";

// TODO: Error Handling
// TODO: Token Refreshing

const APP = express();
const PORT = 7817;
const ENDPOINT = "/api/twitch";
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URL = process.env.TWITCH_REDIRECT_URL;
const STATE = process.env.STATE;
const SCOPES = "channel:bot user:bot user:read:chat user:write:chat";
const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
const BOT_USER_ID = "960074192";
const CHAT_CHANNEL_USER_ID = "61362118";

try {
  const TOKENS = JSON.parse(
    await fs.readFile("tokens.json", { encoding: "utf8" }),
  );
  var AUTH_TOKEN = TOKENS.auth_token;
  var REFRESH_TOKEN = TOKENS.refresh_token;
  var EXPIRE_TIME = TOKENS.expire_time;
} catch (err) {
  if (err.code !== "ENOENT") {
    throw err;
  } else {
    var AUTH_TOKEN = null;
    var REFRESH_TOKEN = null;
    var EXPIRE_TIME = null;
  }
}

//function token_expired(expire_time) {
//  if (Date.now() > EXPIRE_TIME) {
//    return true;
//  } else {
//    return false;
//  }
//}

function encode_params(params) {
  let ENCODED_STRING = "";
  let i = 0;
  Object.entries(params).forEach(([key, value]) => {
    if (i === Object.keys(params).length - 1) {
      ENCODED_STRING += `${key}=${encodeURIComponent(value)}`;
    } else {
      ENCODED_STRING += `${key}=${encodeURIComponent(value)}&`;
    }
    i++;
  });

  return ENCODED_STRING;
}

APP.use(morgan("tiny"));

APP.get(`${ENDPOINT}/authenticate`, async (_req, res) => {
  const TWITCH_CODE_ENDPOINT = "https://id.twitch.tv/oauth2/authorize";
  const PARAMS = {
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    scope: SCOPES,
    state: STATE,
  };

  const URL = `${TWITCH_CODE_ENDPOINT}?${encode_params(PARAMS)}`;
  return res.redirect(URL);
});

APP.get(`${ENDPOINT}/auth_redirect`, async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const CODE = req.query.code;
  const TWITCH_TOKEN_ENDPOINT = "https://id.twitch.tv/oauth2/token";
  const PARAMS = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: CODE,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URL,
  };

  try {
    const RESULT = await axios.post(TWITCH_TOKEN_ENDPOINT, PARAMS);
    const DATA = RESULT.data;

    if (!DATA.hasOwnProperty("access_token")) {
      return res
        .end(JSON.stringify({ error: `Error Fetching Auth Token` }))
        .status(401);
    }

    AUTH_TOKEN = DATA.access_token;
    EXPIRE_TIME = Date.now() + DATA.expires_in * 1000;

    if (DATA.hasOwnProperty("refresh_token")) {
      REFRESH_TOKEN = DATA.refresh_token;
    }

    const TOKENS = JSON.stringify({
      auth_token: AUTH_TOKEN,
      refresh_token: REFRESH_TOKEN,
      expire_time: EXPIRE_TIME,
    });

    await fs.writeFile("tokens.json", TOKENS, { encoding: "utf8" });
  } catch (err) {
    return res
      .end(JSON.stringify({ error: `Server Error: ${err}` }))
      .status(503);
  }
  return res
    .end(JSON.stringify({ message: `Successfully Authenticated Twitch` }))
    .status(200);
});

APP.get(`${ENDPOINT}/start`, async (_req, res) => {
  try {
    let websocket = websocket_client();
    return res.send("Started Bot").status(200);
  } catch (err) {
    return res.send("Server Error").status(500);
  }
});

async function websocket_client() {
  let websocket_client = new WebSocket(EVENTSUB_WEBSOCKET_URL);
  websocket_client.on("error", console.error);
  websocket_client.on("open", () => {
    console.log("WebSocket connection opened to " + EVENTSUB_WEBSOCKET_URL);
  });

  websocket_client.on("message", async (data) => {
    let socket_data = JSON.parse(data.toString());
    let message_type = socket_data.metadata.message_type;

    if (message_type === "session_welcome") {
      const WEBSOCKET_SESSION_ID = socket_data.payload.session.id;
      registerEventSubListeners(WEBSOCKET_SESSION_ID);
    }

    if (message_type === "notification") {
      var subscription_type = socket_data.metadata.subscription_type;
    }

    if (subscription_type === "channel.chat.message") {
      var sender = socket_data.payload.event.broadcaster_user_login;
      var chat_message = socket_data.payload.event.message.text.trim();
      console.log(`${sender}: ${chat_message}`);
    }
  });
  return websocket_client;
}

async function registerEventSubListeners(WEBSOCKET_SESSION_ID) {
  console.log("registerEventSubListeners");
  const HEADERS = {
    Authorization: "Bearer " + AUTH_TOKEN,
    "Client-Id": CLIENT_ID,
    "Content-Type": "application/json",
  };
  const BODY = {
    type: "channel.chat.message",
    version: "1",
    condition: {
      broadcaster_user_id: CHAT_CHANNEL_USER_ID,
      user_id: BOT_USER_ID,
    },
    transport: {
      method: "websocket",
      session_id: WEBSOCKET_SESSION_ID,
    },
  };

  let response = await axios.post(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    BODY,
    { headers: HEADERS },
  );

  if (response.status != 202) {
    let data = response;
    console.error(
      "Failed to subscribe to channel.chat.message. API call returned status code " +
        response.status,
    );
  } else {
    console.log(`Subscribed to channel.chat.message`);
  }
}

APP.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

// NOTE: maybe use later???

//let response = await fetch("https://id.twitch.tv/oauth2/validate", {
//  method: "GET",
//  headers: {
//    Authorization: "OAuth " + AUTH_TOKEN,
//  },
//});
//
//if (response.status != 200) {
//  throw new Error(
//    "Token is not valid. /oauth2/validate returned status code " +
//      response.status,
//  );
//}
//
//console.log(response);
//console.log("Validated token.");
