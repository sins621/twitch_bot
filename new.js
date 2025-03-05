import fs from "node:fs/promises";

try {
  const TOKENS = JSON.parse(
    await fs.readFile("tokens.json", { encoding: "utf8" }),
  );
  var authToken = TOKENS.auth_token;
  var refreshToken = TOKENS.refresh_token;
} catch (err) {
  if (err.code !== "ENOENT") {
    throw err;
  } else {
    var authToken = null;
    var refreshToken = null;
  }
}

class TwitchBot {
  constructor(authToken, refreshToken) {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
  }

  async validateToken() {
    try {
      const RESPONSE = await fetch("https://id.twitch.tv/oauth2/validate", {
        method: "GET",
        headers: {
          Authorization: "OAuth " + this.authToken,
        },
      });

      const DATA = await RESPONSE.json();
      const MESSAGE = DATA.message;
      console.log(MESSAGE);

      if (MESSAGE === "missing authorization token") {
        throw Error("Missing Authorization Token");
      }

      if (RESPONSE.status !== 200) {
        throw Error(`Error Validating Token: ${this.toTitleCase(MESSAGE)}`);
      }
    } catch (err) {
      console.log(err);
    }
  }

  toTitleCase(str) {
    if (!str) {
      return "";
    }
    return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}

const twitchBot = new TwitchBot(authToken, refreshToken);

twitchBot.validateToken();
