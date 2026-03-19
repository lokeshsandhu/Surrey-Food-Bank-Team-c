// resets database to clean state according to schema
// run with 'node resetDB.js'

// specifies path to env vars
const path = require('path');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
});

// create a pool connection to database
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

// resets database by executing schema.sql
async function resetDB() {
    const fs = require('fs');
    const path = require('path');

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
    }
}

resetDB();