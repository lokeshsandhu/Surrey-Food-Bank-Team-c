// resets database to clean state according to schema
// run with 'node resetDB.js'

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

const devEnvPath = path.join(__dirname, "dev.env");

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

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER || process.env.USER,
        host: process.env.DB_HOST || process.env.HOST,
        database: process.env.DB_NAME || process.env.DATABASE,
        password: process.env.DB_PASSWORD || process.env.PASSWORD,
        port: Number(process.env.DB_PORT || process.env.PORT) || 5432,
      }
);

// resets database by executing schema.sql
async function resetDB() {
  try {
    // read sql statements from schema.sql file
    const sqlScript = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

    const statements = sqlScript
      .split(/;\s*[\r\n]+/)
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    let successCount = 0;
    let errorCount = 0;

    // execute all statements from file
    for (const statement of statements) {
      try {
        await pool.query(statement);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    console.log(`Database initialized: ${successCount} successful, ${errorCount} errors`);
    return { success: true, message: "Database reset successfully" };
  } catch (err) {
    console.error("Initialization error:", err.message);
    return { success: false, message: err.message };
  } finally {
    await pool.end();
  }
}

resetDB().catch((err) => {
  console.error("Initialization error:", err.message);
  process.exitCode = 1;
});
