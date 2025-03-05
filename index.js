import "dotenv/config";
import Postgres from "./classes/postgres.js";
import TwitchBot from "./classes/twitchbot.js";


const postgres = new Postgres(
  "postgres",
  process.env.DB_HOST,
  "twitch_bot",
  process.env.DB_PASS,
  5432,
);

const ENV = await postgres.fetchEnvironmentVariables();

const BOT_USER_ID = "960074192";
const CHANNEL_USER_ID = "61362118";

const twitchBot = new TwitchBot(
  ENV.AUTH_TOKEN,
  ENV.REFRESH_TOKEN,
  ENV.CLIENT_ID,
  BOT_USER_ID,
  CHANNEL_USER_ID,
);
twitchBot.start();
