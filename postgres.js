import pg from "pg";
import "dotenv/config";

export default class Postgres {
  constructor(user, host, database, password, port) {
    this.db = new pg.Client({
      user: user,
      host: host,
      database: database,
      password: password,
      port: port,
    });
    this.db.connect();
  }

  async fetchEnvironmentVariables() {
    try {
      const QUERY = await this.db.query(`
        SELECT * FROM public.env_vars
        ORDER BY id ASC
      `);
      const ROWS = QUERY.rows;
      const ENVIRONMENT_VARIABLES = {};
      ROWS.forEach((row) => {
        ENVIRONMENT_VARIABLES[row.name] = row.key;
      });
      return ENVIRONMENT_VARIABLES;
    } catch (err) {
      throw new Error(`Failed to fetch environment variables: ${err.message}`);
    }
  }
}

const postgres = new Postgres(
  "postgres",
  process.env.DB_HOST,
  "twitch_bot",
  process.env.DB_PASS,
  5432,
);

// tests
console.log(await postgres.fetchEnvironmentVariables());
process.exit();
