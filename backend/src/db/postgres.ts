import { Pool, PoolConfig, types as pgTypes } from "pg";
import { env } from "../config/env";

// Ensure Postgres `DATE` columns (OID 1082) are returned as plain `YYYY-MM-DD` strings.
// Without this, node-postgres may return JS Date objects that JSON-serialize to UTC midnight
// (e.g. "2026-03-17T00:00:00.000Z"), which can shift a day when formatted in a browser's
// local timezone.
pgTypes.setTypeParser(1082, (value) => value);

const poolConfig: PoolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
    }
  : {
      user: env.DB_USER,
      host: env.DB_HOST,
      database: env.DB_NAME,
      password: env.DB_PASSWORD,
      port: env.DB_PORT,
    };

if (env.DB_SSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

if (shouldLoadDevEnv) {
  dotenv.config({ path: devEnvPath, override: true });
}

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || process.env.USER,
      host: process.env.DB_HOST || process.env.HOST,
      database: process.env.DB_NAME || process.env.DATABASE,
      password: process.env.DB_PASSWORD || process.env.PASSWORD,
      port: Number(process.env.DB_PORT || process.env.PORT) || 5432,
    };

export default new Pool(poolConfig);
