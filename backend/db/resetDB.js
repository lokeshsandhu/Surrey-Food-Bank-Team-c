// resets database to clean state according to schema
// run with 'node resetDB.js'

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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
            port: Number(process.env.DB_PORT || process.env.PORT) || 5432,
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
            .map((stmt) => stmt.trim())
            .filter((stmt) => stmt.length > 0);

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

        const adminPassword = await bcrypt.hash('adminPassword#123', 10);
        await pool.query(
            `
            INSERT INTO account (
                username,
                user_password,
                canada_status,
                household_size,
                addr,
                baby_or_pregnant,
                language_spoken,
                account_notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (username) DO UPDATE SET
                user_password = EXCLUDED.user_password,
                canada_status = EXCLUDED.canada_status,
                household_size = EXCLUDED.household_size,
                addr = EXCLUDED.addr,
                baby_or_pregnant = EXCLUDED.baby_or_pregnant,
                language_spoken = EXCLUDED.language_spoken,
                account_notes = EXCLUDED.account_notes
        `,
            ['admin', adminPassword, null, null, null, null, null, 'Admin account']
        );
        await pool.query(
            `
            INSERT INTO familymember (
                username,
                f_name,
                l_name,
                dob,
                phone,
                email,
                relationship
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (username, id) DO NOTHING
        `,
            ['admin', 'Admin', 'Account', null, null, 'admin@surreyfoodbank.com', 'owner']
        );

        console.log(`Database initialized: ${successCount} successful, ${errorCount} errors. Admin account seeded.`);
        return { success: true, message: 'Database reset successfully with admin account' };
    } catch (err) {
        console.error('Initialization error:', err.message);
        return { success: false, message: err.message };
    } finally {
        await pool.end();
    }
}

resetDB().catch((err) => {
    console.error('Initialization error:', err.message);
    process.exitCode = 1;
});
