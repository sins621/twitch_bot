import "dotenv/config";
import Postgres from "./postgres.js";
import TwitchBot from "./twitchbot.js";

const postgres = new Postgres(
  "postgres",
  process.env.DB_HOST,
  "twitch_bot",
  process.env.DB_PASS,
  5432,
);

const ENV = await postgres.fetchEnvironmentVariables();
const twitchBot = new TwitchBot(ENV.UTH_TOKEN, ENV.REFRESH_TOKEN);
twitchBot.start();
