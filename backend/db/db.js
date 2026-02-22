// import { Client } from 'pg'
// const client = await new Client().connect()

// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
// await client.end()

// specifies path to env vars
const { TIMEOUT } = require('dns');
const path = require('path');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
});

// create a pool connection to database
const { Pool, Client } = require('pg');

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

// example query with paramaterized inputs
async function sampleQuery() {
    try {
        const text = `INSERT INTO account VALUES ($1, $2, $3, $4, $5, $6)`;
        const values = ['pia', 'password', 'wow', 10, 'please work', 'f'];

        const res = await pool.query(text, values);
        //const {rows} = await pool.query('SELECT tablename FROM pg_catalog.pg_tables');
        console.log(res);
    } catch (err) {
        console.log(err);
    }
}


// INSERT functions
// create a new account with given inputs (mandatory username and password)
async function insertAccount(username, password, canadaStatus, householdSize, addr, babyOrPregnant) {
    try {
        const text = `INSERT INTO account VALUES ($1, $2, $3, $4, $5, $6)`;
        const values = [username, password, canadaStatus, householdSize, addr, babyOrPregnant];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// create a new familymember with given inputs (mandatory username and first name)
async function insertFamilyMember(username, fname, lname, dob, phone, email, relationship) {
    try {
        const text = `INSERT INTO familymember VALUES ($1, $2, $3, to_date($4, 'DD/MM/YYYY'), $5, $6, $7)`;
        const values = [username, fname, lname, dob, phone, email, relationship];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// create a new appointment with given inputs (mandatory appointment date, start time and end time)
async function insertAppointment(apptDate, startTime, endTime, apptNotes, username) {
    try {
        const text = `INSERT INTO appointment 
                        VALUES (
                            to_date($1, 'DD/MM/YYYY'), 
                            to_timestamp($2, 'HH24:MI'), 
                            to_timestamp($3, 'HH24:MI'), 
                            $4, $5)`;
        const values = [apptDate, startTime, endTime, apptNotes, username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}


// UPDATE functions
// update account information except for password, assumes values not changed by user are automatically inputted as the current value
async function updateAccount(username, newUsername, newCanadaStatus, newHouseholdSize, newAddr, newBabyOrPregnant) {
    try {
        const text = `UPDATE account 
                        SET username = $1, 
                            canada_status = $2, 
                            household_size = $3, 
                            addr = $4, 
                            baby_or_pregnant = $5 
                        WHERE username = $6`;
        const values = [newUsername, newCanadaStatus, newHouseholdSize, newAddr, newBabyOrPregnant, username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// update family member information, assumes values not changed by user are automatically inputted as the current value
async function updateFamilyMember(username, fname, newFName, newLName, newDOB, newPhone, newEmail) {
    try {
        const text = `UPDATE familymember
                        SET f_name = $1, 
                            l_name = $2, 
                            dob = to_date($3, 'DD/MM/YYYY'), 
                            phone = $4, 
                            email = $5 
                        WHERE username = $6 AND fname = $7`;
        const values = [newFName, newLName, newDOB, newPhone, newEmail, username, fname];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// update appointment information, assumes values not changed by user are automatically inputted as the current value
async function updateAppointment(username, apptDate, startTime, newApptDate, newStartTime, newEndTime, newApptNotes) {
    try {
        const text = `UPDATE appointment
                        SET appt_date = to_date($1, 'DD/MM/YYYY'), 
                            start_time = to_timestamp($2, 'HH24:MI'), 
                            end_time = to_timestamp($3, 'HH24:MI'), 
                            appt_notes = $4, 
                        WHERE appt_date = to_date($5, 'DD/MM/YYYY') 
                            AND start_time = to_timestamp($6, 'HH24:MI') 
                            AND username = to_timestamp($7, 'HH24:MI')`;
        const values = [newApptDate, newStartTime, newEndTime, newApptNotes, apptDate, startTime, username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// update baby/pregnancy status of given account
async function updateBabyOrPregnant(username, newBabyOrPregnant) {
    try {
        const text = `UPDATE account 
                        SET baby_or_pregnant = $1 
                        WHERE username = $2`;
        const values = [newBabyOrPregnant, username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}


// DELETE functions
// delete account with given username
async function deleteAccountFromUsername(username) {
    try {
        const text = `DELETE FROM account WHERE username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// delete family member with given username and first name
async function deleteFamilyMemberFromUsernameFName(username, fname) {
    try {
        const text = `DELETE FROM familymember WHERE username = $1 AND f_name = $2`;
        const values = [username, fname];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// delete appointment with given username, appointment date and start time
async function deleteAppointmentFromUsernameDateStart(username, apptDate, startTime) {
    try {
        const text = `DELETE FROM appointment 
                            WHERE username = $1 
                            AND appt_date = to_date($2, 'DD/MM/YYYY') 
                            AND start_time = to_timestamp($3, 'HH24:MI')`;
        const values = [username, apptDate, startTime];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// delete all appointments with given username
async function deleteAppointmentFromUsername(username) {
    try {
        const text = `DELETE FROM appointment WHERE username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// delete appointments with given appointment date
async function deleteAppointmentFromDate(apptDate) {
    try {
        const text = `DELETE FROM appointment appt_date = to_date($1, 'DD/MM/YYYY')`;
        const values = [apptDate];

        const res = await pool.query(text, values);
        return res;
    } catch (err) {
        console.log(err);
    }
}

// QUERY functions
// select account from given username
async function findAccountFromUsername(username) {
    try {
        const text = `SELECT * FROM account WHERE username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all family members from given username
async function findFamilyMembersFromUsername(username) {
    try {
        const text = `SELECT * FROM familymember WHERE username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select family member(s) with given first name
async function findFamilyMembersFromFName(fname) {
    try {
        const text = `SELECT * FROM familymember WHERE f_name = $1`;
        const values = [fname];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select family member(s) with given last name
async function findFamilyMembersFromLName(lname) {
    try {
        const text = `SELECT * FROM familymember WHERE l_name = $1`;
        const values = [lname];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all family members with account info from given username
async function findAccountAndFamilyMembersFromUsername(username) {
    try {
        const text = `SELECT * 
                        FROM account AS a 
                        JOIN familymember AS m 
                        ON a.username = m.username 
                        WHERE a.username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments with given username
async function findAppointmentFromUsername(username) {
    try {
        const text = `SELECT * FROM appointment WHERE username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments and account info with given username
async function findAppointmentAndAccountFromUsername(username) {
    try {
        const text = `SELECT * 
                        FROM appointment AS app 
                        JOIN account AS a 
                        ON app.username = a.username 
                        WHERE a.username = $1`;
        const values = [username];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments with given appointment date
async function findAppointmentFromApptDate(apptDate) {
    try {
        const text = `SELECT * FROM appointment WHERE appt_date = to_date($1, 'DD/MM/YYYY')`;
        const values = [apptDate];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments with given appointment date and starttime
async function findAppointmentFromApptDateAndStartTime(apptDate, startTime) {
    try {
        const text = `SELECT * FROM appointment 
                        WHERE appt_date = to_date($1, 'DD/MM/YYYY') 
                            AND start_date = to_timestamp($2, 'HH24:MI')`;
        const values = [apptDate, startTime];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments within given date range (inclusive)
async function findAppointmentInDateRange(startDate, endDate) {
    try {
        const text = `SELECT * FROM appointment 
                        WHERE appt_date >= to_date($1, 'DD/MM/YYYY') 
                            AND appt_date <= to_date($2, 'DD/MM/YYYY')`;
        const values = [startDate, endDate];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments within given time range (inclusive)
async function findAppointmentInTimeRange(startTime, endTime) {
    try {
        const text = `SELECT * FROM appointment 
                        WHERE start_date >= to_timestamp($1, 'HH24:MI') 
                            AND end_date <= to_timestamp($2, 'HH24:MI')`;
        const values = [startTime, endTime];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}

// select all appointments within given date and time range (inclusive)
async function findAppointmentInDateTimeRange(apptDate, startTime, endTime) {
    try {
        const text = `SELECT * FROM appointment 
                        WHERE appt_date = to_date($1, 'DD/MM/YYYY')
                            AND start_date >= to_timestamp($2, 'HH24:MI') 
                            AND end_date <= to_timestamp($3, 'HH24:MI')`;
        const values = [apptDate, startTime, endTime];

        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.log(err);
    }
}


module.exports = {
    insertAccount,
    insertFamilyMember,
    insertAppointment,
    updateAccount,
    updateFamilyMember,
    updateAppointment,
    updateBabyOrPregnant,
    deleteAccountFromUsername,
    deleteAppointmentFromDate,
    deleteAppointmentFromUsername,
    deleteAppointmentFromUsernameDateStart,
    deleteFamilyMemberFromUsernameFName,
    findAccountAndFamilyMembersFromUsername,
    findAccountFromUsername,
    findAppointmentAndAccountFromUsername,
    findAppointmentFromApptDate,
    findAppointmentFromApptDateAndStartTime,
    findAppointmentFromUsername,
    findAppointmentInDateRange,
    findAppointmentInTimeRange,
    findAppointmentInDateTimeRange,
    findFamilyMembersFromFName,
    findFamilyMembersFromLName,
    findFamilyMembersFromUsername
};