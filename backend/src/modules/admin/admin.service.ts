import pool from "../../db/postgres";
import { decryptRowFromDb, decryptRowsFromDb } from "../../shared/crypto/dbFieldEncryption";

export async function getAllClients() {
    const text = `
        SELECT username, canada_status, household_size, addr, baby_or_pregnant
        FROM account
        ORDER BY username
    `;
    const { rows } = await pool.query(text);
    return decryptRowsFromDb("account", rows);
}

export async function getClientByUsername(username: string) {
    const accountText = `
        SELECT username, canada_status, household_size, addr, baby_or_pregnant
        FROM account
        WHERE username = $1
    `;
    const accountResult = await pool.query(accountText, [username]);
    const account = accountResult.rows[0] ? decryptRowFromDb("account", accountResult.rows[0]) : null;
    if (!account) return null;

    const familyText = `
        SELECT username, f_name, l_name, dob, phone, email, relationship
        FROM familymember
        WHERE username = $1
        ORDER BY f_name
    `;
    const familyResult = await pool.query(familyText, [username]);

    const apptText = `
        SELECT appt_date, start_time, end_time, appt_notes, username
        FROM appointment
        WHERE username = $1
        ORDER BY appt_date, start_time
    `;
    const apptResult = await pool.query(apptText, [username]);

    return {
        ...account,
        family_members: decryptRowsFromDb("familymember", familyResult.rows),
        appointments: decryptRowsFromDb("appointment", apptResult.rows),
    };
}

export async function getAllAppointments() {
    const text = `
        SELECT appt_date, start_time, end_time, appt_notes, username
        FROM appointment
        ORDER BY appt_date, start_time
    `;
    const { rows } = await pool.query(text);
    return decryptRowsFromDb("appointment", rows);
}
