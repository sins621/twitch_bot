export default class TwitchBot {
  constructor(authToken, refreshToken) {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
  }

  async start() {
    try {
      await this.validateToken();
    } catch (err) {
      console.log(err);
      process.exit();
    }
  }

  async validateToken() {
    const RESPONSE = await fetch("https://id.twitch.tv/oauth2/validate", {
      method: "GET",
      headers: {
        Authorization: "OAuth " + this.authToken,
      },
    });

    const DATA = await RESPONSE.json();
    const MESSAGE = DATA.message;

    if (RESPONSE.status !== 200) {
      throw new Error(this.toTitleCase(MESSAGE));
    }
  }

  toTitleCase(str) {
    if (!str) {
      return "";
    }
    return str.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}
