import express from "express";

const ENDPOINT = "/api/twitch";

export default class TokenGenerator {
  constructor(clientID, clientSecret, redirectURL, scopes, state) {
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.redirectURL = redirectURL;
    this.scopes = scopes;
    this.state = state;
    this.port = 7817;
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get(`${ENDPOINT}/authenticate`, async (_req, res) => {
      const TWITCH_CODE_ENDPOINT = "https://id.twitch.tv/oauth2/authorize";
      const PARAMS = {
        response_type: "code",
        client_id: this.clientID,
        redirect_uri: this.redirectURL,
        scope: this.scopes,
        state: this.state,
      };

      const URL = `${TWITCH_CODE_ENDPOINT}?${this.encodeParams(PARAMS)}`;
      return res.redirect(URL);
    });
    this.app.listen(this.port, () => {
      console.log(`Token Generator listening on port ${this.port}.`);
    });
  }

  encodeParams(params) {
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

  async retrieveTokens() {
    console.log("Starting redirect server.");
    const CODE = await this.retrieveCode();
    console.log("Fetching new tokens.");
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientID,
        client_secret: this.clientSecret,
        code: CODE,
        grant_type: "authorization_code",
        redirect_uri: this.redirectURL,
      }),
    });
    const DATA = await response.json();
    if (!DATA.access_token) throw new Error(DATA.message);
    console.log("New tokens retrieved.");
    return {
      authToken: DATA.access_token,
      refreshToken: DATA.refresh_token,
    };
  }

  retrieveCode() {
    return new Promise((resolve, reject) => {
      this.app.get(`${ENDPOINT}/auth_redirect`, async (req, res) => {
        if (!req.query.code) {
          return reject(new Error("No code received from Twitch"));
        }
        console.log("Redirect code received.");
        res.json({ message: "Code received. You can close this tab." });
        resolve(req.query.code);
      });
    });
  }
}
