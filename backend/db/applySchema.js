const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const envFileCandidates = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), "db/dev.env"),
  path.resolve(__dirname, "dev.env"),
].filter(Boolean);

for (const envFile of envFileCandidates) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

const useConnectionString = Boolean(process.env.DATABASE_URL);
const enableSsl = process.env.DB_SSL === "true";

const pool = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER || process.env.USER,
        host: process.env.DB_HOST || process.env.HOST,
        database: process.env.DB_NAME || process.env.DATABASE,
        password: process.env.DB_PASSWORD || process.env.PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        ssl: enableSsl ? { rejectUnauthorized: false } : undefined,
      },
);

async function applySchema() {
  const schemaPath = path.join(__dirname, "deploySchema.sql");
  const sqlScript = fs.readFileSync(schemaPath, "utf8");

  try {
    await pool.query(sqlScript);
    console.log("Database schema applied successfully.");
  } finally {
    await pool.end();
  }
}

applySchema().catch((error) => {
  console.error("Failed to apply database schema:", error.message);
  process.exitCode = 1;
});
