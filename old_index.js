import express from "express";
import axios from "axios";
import fs from "node:fs/promises";
import morgan from "morgan";
import "dotenv/config";
import WebSocket from "ws";
import Postgres from "./postgres.js";

const postgres = new Postgres(
  "postgres",
  process.env.DB_HOST,
  "twitch_bot",
  process.env.DB_PASS,
  5432,
);

const ENV = await postgres.fetchEnvironmentVariables();

// TODO: Error Handling
// TODO: Validate Token on Startup and Refresh if Necessary
// TODO: Deployment

const app = express();
const PORT = 7817;
const ENDPOINT = "/api/twitch";
const CLIENT_ID = ENV.CLIENT_ID;
const CLIENT_SECRET = ENV.CLIENT_SECRET;
const REDIRECT_URL = ENV.REDIRECT_URL;
const STATE = ENV.STATE;
const SCOPES = "channel:bot user:bot user:read:chat user:write:chat";
const EVENTSUB_WEBSOCKET_URL = "wss://eventsub.wss.twitch.tv/ws";
const BOT_USER_ID = "960074192";
const CHAT_CHANNEL_USER_ID = "61362118";
const SPOTIFY_ENDPOINT = "https://www.sins621.com/api/spotify";

var authToken = ENV.AUTH_TOKEN;
var refreshToken = ENV.REFRESH_TOKEN;

function encodeParams(params) {
  let encodedString = "";
  let i = 0;
  Object.entries(params).forEach(([key, value]) => {
    if (i === Object.keys(params).length - 1) {
      encodedString += `${key}=${encodeURIComponent(value)}`;
    } else {
      encodedString += `${key}=${encodeURIComponent(value)}&`;
    }
    i++;
  });

  return encodedString;
}

app.use(morgan("tiny"));

app.get(`${ENDPOINT}/authenticate`, async (_req, res) => {
  const TWITCH_CODE_ENDPOINT = "https://id.twitch.tv/oauth2/authorize";
  const PARAMS = {
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URL,
    scope: SCOPES,
    state: STATE,
  };

  const URL = `${TWITCH_CODE_ENDPOINT}?${encodeParams(PARAMS)}`;
  return res.redirect(URL);
});

app.get(`${ENDPOINT}/auth_redirect`, async (req, res) => {
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

    authToken = DATA.access_token;

    if (DATA.hasOwnProperty("refresh_token")) {
      refreshToken = DATA.refresh_token;
    }

    const TOKENS = JSON.stringify({
      auth_token: authToken,
      refresh_token: refreshToken,
    });

    await fs.writeFile("tokens.json", TOKENS, { encoding: "utf8" });
  } catch (err) {
    return res
      .end(JSON.stringify({ error: `Sugma Error: ${err}` }))
      .status(503);
  }
  return res
    .end(JSON.stringify({ message: `Successfully Authenticated Twitch` }))
    .status(200);
});

app.listen(PORT, () => {
  console.log(`Listening on port: http://localhost:${PORT}`);
});

try {
  let response = await fetch("https://id.twitch.tv/oauth2/validate", {
    method: "GET",
    headers: {
      Authorization: "OAuth " + authToken,
    },
  });

  if (response.status == 401) {
    const TWITCH_REFRESH_ENDPOINT = "https://id.twitch.tv/oauth2/token";
    const PARAMS = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    try {
      const RESULT = await axios.post(TWITCH_REFRESH_ENDPOINT, PARAMS);
      const DATA = RESULT.data;

      if (!DATA.hasOwnProperty("access_token")) {
        throw Error(`Error Fetching Auth Token`);
      }

      authToken = DATA.access_token;

      if (DATA.hasOwnProperty("refresh_token")) {
        refreshToken = DATA.refresh_token;
      }

      const TOKENS = JSON.stringify({
        auth_token: authToken,
        refresh_token: refreshToken,
      });

      await fs.writeFile("tokens.json", TOKENS, { encoding: "utf8" });
    } catch (err) {
      console.log(`sugma Error: ${err}`);
    }
  } else if (response.status != 200) {
    console.log(
      "Token is not valid. /oauth2/validate returned status code " +
        response.status,
    );
  }

  console.log(response);
  console.log("Validated token.");
} catch (err) {
  console.log("Error Starting Twitch Bot");
} finally {
  let websocketClient = new WebSocket(EVENTSUB_WEBSOCKET_URL);
  websocketClient.on("error", console.error);
  websocketClient.on("open", () => {
    console.log("WebSocket connection opened to " + EVENTSUB_WEBSOCKET_URL);
  });

  websocketClient.on("message", async (data) => {
    let socketData = JSON.parse(data.toString());
    let messageType = socketData.metadata.message_type;

    if (messageType === "session_welcome") {
      const WEBSOCKET_SESSION_ID = socketData.payload.session.id;
      console.log("Registering Event Sub Listeners");
      const HEADERS = {
        Authorization: "Bearer " + authToken,
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
      console.log(HEADERS);
      console.log(BODY);

      try {
        let response = await axios.post(
          "https://api.twitch.tv/helix/eventsub/subscriptions",
          BODY,
          { headers: HEADERS },
        );
        var responseStatus = response.data.status;
      } catch (err) {
        if (responseStatus != 202) {
          console.error(
            "Failed to subscribe to channel.chat.message. API call returned status code " +
              responseStatus,
          );
        } else {
          console.log(`Subscribed to channel.chat.message`);
        }
      }
    }

    if (messageType === "notification") {
      var subscriptionType = socketData.metadata.subscription_type;
    }

    // TODO: Refactor this into something with less nesting somehow
    if (subscriptionType === "channel.chat.message") {
      var sender = socketData.payload.event.chatter_user_login;
      var chatMessage = socketData.payload.event.message.text.trim();
      console.log(`${sender}: ${chatMessage}`);
      if (Array.from(chatMessage)[0] === "!") {
        var chatCommand = chatMessage.match(/^\s*(\S+)\s*(.*?)\s*$/).slice(1);
        if (Array.from(chatCommand[1]).length === 0) {
          switch (chatCommand[0]) {
            case "!song":
              try {
                const REQUEST = await axios.get(`${SPOTIFY_ENDPOINT}/playing`);
                if (REQUEST.status === 204) {
                  sendChatMessage("No song is currently playing");
                  break;
                }
                const DATA = REQUEST.data;
                const SONG_NAME = DATA.song_name;
                const ARTISTS = DATA.artists.toString().replace(/,/g, ", ");
                sendChatMessage(`Now playing ${SONG_NAME} by ${ARTISTS}.`);
              } catch (err) {
                console.log(err);
              }
              break;

            case "!queue":
              try {
                const REQUEST = await axios.get(`${SPOTIFY_ENDPOINT}/queue`);
                if (REQUEST.status === 204 || REQUEST.data.length === 0) {
                  sendChatMessage("No songs are currently playing");
                  break;
                }
                const DATA = REQUEST.data;
                let message = "";
                for (let i = 0; i < DATA.length; ++i) {
                  const SONG_NAME = DATA[i].song_name;
                  const ARTISTS = DATA[i].artists
                    .toString()
                    .replace(/,/g, ", ");
                  message += `${i + 1}. ${SONG_NAME} by ${ARTISTS}`;
                  if (i < DATA.length - 1) {
                    message += ", ";
                  } else {
                    message += ".";
                  }
                }
                sendChatMessage(message);
              } catch (err) {
                console.log(err);
              }
              break;

            case "!skip":
              try {
                await axios.get(`${SPOTIFY_ENDPOINT}/skip`);
                sendChatMessage("Song Skipped");
              } catch (err) {}
          }
        } else {
          switch (chatCommand[0]) {
            case "!songrequest":
              try {
                const REQUEST = await fetch(
                  `${SPOTIFY_ENDPOINT}/search?` +
                    new URLSearchParams({
                      q: chatCommand[1],
                    }).toString(),
                );
                const DATA = await REQUEST.json();
                const SONG_NAME = DATA.song_name;
                const ARTISTS = DATA.artists.toString().replace(/,/g, ", ");
                sendChatMessage(
                  `Added ${SONG_NAME} by ${ARTISTS} to the queue.`,
                );
              } catch (err) {
                console.log(err);
              }
              break;
          }
        }
      }
    }
  });
}

async function sendChatMessage(chatMessage) {
  const HEADERS = {
    Authorization: "Bearer " + authToken,
    "Client-Id": CLIENT_ID,
    "Content-Type": "application/json",
  };
  const BODY = {
    broadcaster_id: CHAT_CHANNEL_USER_ID,
    sender_id: BOT_USER_ID,
    message: chatMessage,
  };

  let response = await axios.post(
    "https://api.twitch.tv/helix/chat/messages",
    BODY,
    { headers: HEADERS },
  );

  if (response.status != 200) {
    let data = await response.json();
    console.error("Failed to send chat message");
    console.error(data);
  } else {
    console.log("Sent chat message: " + chatMessage);
  }
}
