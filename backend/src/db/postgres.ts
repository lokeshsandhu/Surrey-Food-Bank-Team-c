import { Pool, PoolConfig } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const devEnvPath = path.join(__dirname, "../../db/dev.env");

// In CI, credentials are typically provided via environment variables and we
// should not override them from a local dev file.
const shouldLoadDevEnv =
  !process.env.CI &&
  fs.existsSync(devEnvPath) &&
  !process.env.DATABASE_URL &&
  !process.env.DB_USER &&
  !process.env.DB_HOST &&
  !process.env.DB_NAME &&
  !process.env.DB_PASSWORD;

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
