import pool from "../../db/postgres";

// Select all rows in account table, return rows
export async function getAllClients() {
    const text = `
        SELECT *
        FROM account
        ORDER BY username
    `;
    const { rows } = await pool.query(text);
    return rows;
}

// Select from account table with given username
// If username is found in account table, select all rows in familymember table and booked appointment slots with given username
// Return familymember and appointment rows
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
        SELECT
            s.appt_date,
            s.start_time,
            s.end_time,
            s.appt_notes,
            s.capacity,
            b.username
        FROM appointment_booking b
        JOIN appointment_slot s
          ON s.appt_date = b.appt_date
         AND s.start_time = b.start_time
        WHERE b.username = $1
        ORDER BY s.appt_date, s.start_time
    `;
    const apptResult = await pool.query(apptText, [username]);

    return {
        ...account,
        family_members: familyResult.rows,
        appointments: apptResult.rows,
    };
}

// Select all rows from appointment_slot table with booked counts, return rows
export async function getAllAppointments() {
    const text = `
        SELECT
            s.appt_date,
            s.start_time,
            s.end_time,
            s.appt_notes,
            s.capacity,
            COUNT(b.username)::int AS booked_count,
            GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
            COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames
        FROM appointment_slot s
        LEFT JOIN appointment_booking b
          ON b.appt_date = s.appt_date
         AND b.start_time = s.start_time
        GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
        ORDER BY s.appt_date, s.start_time
    `;
    const { rows } = await pool.query(text);
    return rows;
}