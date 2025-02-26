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
  console.log(TOKENS);
} catch (err) {
  if (err.code !== "ENOENT") {
    throw err;
  } else {
    var AUTH_TOKEN = null;
    var REFRESH_TOKEN = null;
    var EXPIRE_TIME = null;
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
      return res.send("Authorization Failed").status(401);
    }

    AUTH_TOKEN = DATA.access_token;
    EXPIRE_TIME = Date.now() + DATA.expire_time * 1000;

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
    console.log(err);
  }
  return res.send("Twitch is Authenticated").status(200);
});

APP.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
