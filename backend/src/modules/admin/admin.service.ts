import pool from "../../db/postgres";

export async function getAllClients() {
    const text = `
        SELECT *
        FROM account
        ORDER BY username
    `;
    const { rows } = await pool.query(text);
    return rows;
}

export async function getClientByUsername(username: string) {
    const accountText = `
        SELECT *
        FROM account
        WHERE username = $1
    `;
    const accountResult = await pool.query(accountText, [username]);
    const account = accountResult.rows[0] ?? null;
    if (!account) return null;

    const familyText = `
        SELECT *
        FROM familymember
        WHERE username = $1
        ORDER BY f_name
    `;
    const familyResult = await pool.query(familyText, [username]);

    const apptText = `
        SELECT *
        FROM appointment
        WHERE username = $1
        ORDER BY appt_date, start_time
    `;
    const apptResult = await pool.query(apptText, [username]);

    return {
        ...account,
        family_members: familyResult.rows,
        appointments: apptResult.rows,
    };
}

export async function getAllAppointments() {
    const text = `
        SELECT *
        FROM appointment
        ORDER BY appt_date, start_time
    `;
    const { rows } = await pool.query(text);
    return rows;
}