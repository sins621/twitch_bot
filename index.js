import TwitchBot from "./twitch_bot.js";

function hello() {
  return "hello";
}

const commands = {
  "!today":
    "Refactoring Twitch-bot Code and Potentially adding Spotify Support",
  "!song": hello(),
};

const twitchBot = new TwitchBot(commands);

twitchBot.run();
