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
    console.log("Fetching Environment Variables");
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
