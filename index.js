import TwitchBot from "./twitch_bot.js";
import Requests from "./requests.js";

const requests = new Requests();

const commands = {
  "!today":
    "Refactoring Twitch-bot Code and Potentially adding Spotify Support",
  "!song": requests.request("spa/now_playing", "GET"),
};

const twitchBot = new TwitchBot(commands);

twitchBot.run();
