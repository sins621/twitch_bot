import pg from "pg";

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
    console.log("Fetching environment variables.");
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

  async updateTokens(authToken, refreshToken) {
    console.log("Updating tokens on the database.");
    try {
      await this.db.query(
        `
         UPDATE public.env_vars
         SET key = CASE 
             WHEN name = 'AUTH_TOKEN' THEN $1
             WHEN name = 'REFRESH_TOKEN' THEN $2
             ELSE key
         END
         WHERE name IN ('AUTH_TOKEN', 'REFRESH_TOKEN');
      `,
        [authToken, refreshToken]
      );
      console.log("Tokens updated.");
    } catch (err) {
      throw new Error(`Failed to update tokens: ${err.message}`);
    }
  }
}
