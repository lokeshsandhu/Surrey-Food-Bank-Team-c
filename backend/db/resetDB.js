// resets database to clean state according to schema
// run with 'node resetDB.js'

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = import.meta.dirname;

const envFileCandidates = [
    process.env.ENV_FILE,
    path.resolve(process.cwd(), 'db/dev.env'),
    path.resolve(__dirname, 'dev.env'),
].filter(Boolean);

for (const envFile of envFileCandidates) {
    if (fs.existsSync(envFile)) {
        dotenv.config({ path: envFile, override: true });
        break;
    }
}

// create a pool connection to database
import { Pool } from 'pg';

const useConnectionString = Boolean(process.env.DATABASE_URL);
const enableSsl = process.env.DB_SSL === 'true';

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
        }
);

// resets database by executing schema.sql
async function resetDB() {
    try {
        // read sql statements from schema.sql file
        const sqlScript = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        const statements = sqlScript
            .split(/;\s*[\r\n]+/)
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        let successCount = 0;
        let errorCount = 0;

        // execute all statements from file
        for (const statement of statements) {
            try {
                await pool.query(statement);
                successCount++;
            } catch (err) {
                errorCount++;
            }
        }

        console.log(`Database initialized: ${successCount} successful, ${errorCount} errors`);
        return { success: true, message: `Database reset successfully` };
    } catch (err) {
        console.error('Initialization error:', err.message);
        return { success: false, message: err.message };
    } finally {
        await pool.end();
    }
}

resetDB();
