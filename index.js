import express from "express";
import axios from "axios";
import fs from "node:fs/promises";
import morgan from "morgan";
import "dotenv/config";

const APP = express();
const PORT = 7817;
const ENDPOINT = "/api/twitch";
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URL = process.env.TWITCH_REDIRECT_URL;
const STATE = process.env.STATE;
const SCOPES = "user:bot user:read:chat user:write:chat";

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

function token_expired(expire_time) {
  if (Date.now() > expire_time) {
    return true;
  } else {
    return false;
  }
}

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

APP.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
