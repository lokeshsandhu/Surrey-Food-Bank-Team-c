import pool from "../../db/postgres";
import { CreateSlotDTO, BookAppointmentDTO, CreateAppointmentsInRangeDTO } from "./appointments.dto";
// Update an appointment by date and start_time
export async function updateAppointment(appt_date: string, start_time: string, updateData: Partial<{ end_time: string; appt_notes: string; username: string }>) {
    const fields = [];
    const values = [appt_date, start_time];
    let idx = 3;
    for (const [key, value] of Object.entries(updateData)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
    }
    if (fields.length === 0) throw new Error("No fields to update");
    const text = `UPDATE appointment SET ${fields.join(", ")} WHERE appt_date = $1 AND start_time = $2 RETURNING *`;
    const { rows } = await pool.query(text, values);
    return rows[0] ?? null;
}


// Delete appointment by date
export async function deleteAppointmentFromDate(appt_date: string) {
    const text = `DELETE FROM appointment WHERE appt_date = $1 RETURNING *`;
    const { rows } = await pool.query(text, [appt_date]);
    return rows;
}

// Delete appointment by username
export async function deleteAppointmentFromUsername(username: string) {
    const text = `DELETE FROM appointment WHERE username = $1 RETURNING *`;
    const { rows } = await pool.query(text, [username]);
    return rows;
}

// Delete appointment by username, date, and start_time
export async function deleteAppointmentFromUsernameDateStart(username: string, appt_date: string, start_time: string) {
    const text = `DELETE FROM appointment WHERE username = $1 AND appt_date = $2 AND start_time = $3 RETURNING *`;
    const { rows } = await pool.query(text, [username, appt_date, start_time]);
    return rows[0] ?? null;
}

// Find appointment by appt_date and start_time
export async function findAppointmentFromApptDateAndStartTime(appt_date: string, start_time: string) {
    const text = `SELECT * FROM appointment WHERE appt_date = $1 AND start_time = $2`;
    const { rows } = await pool.query(text, [appt_date, start_time]);
    return rows[0] ?? null;
}

// Admin uses this to create multiple appointments in a range. It enforces that it starts and ends on 15 min intervals, 
// and only creates slots between 08:00 and 16:00. It also checks for overlapping slots and only creates non-overlapping ones.
// I heavily used copilot in this function.
export async function createAppointmentsInTimeRange(data: CreateAppointmentsInRangeDTO) {
    const [startHour, startMin] = data.start_time.split(":").map(Number);
    const [endHour, endMin] = data.end_time.split(":").map(Number);
    if (startMin % 15 !== 0 || endMin % 15 !== 0) {
        throw new Error("Start and end times must be multiples of 15 minutes (e.g., 08:00, 08:15, 08:30, ...)");
    }
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    if (startTotal < 8 * 60 || endTotal > 16 * 60 || startTotal >= endTotal) {
        throw new Error("Appointments can only be created between 08:00 and 16:00, and start_time must be before end_time.");
    }
    const slots = [];
    let current = new Date(`${data.appt_date}T${data.start_time}:00Z`);
    const end = new Date(`${data.appt_date}T${data.end_time}:00Z`);
    while (current < end) {
        const slotStart = current.toISOString().substring(11, 16);
        const next = new Date(current.getTime() + 15 * 60000);
        const slotEnd = next.toISOString().substring(11, 16);
        if (next > end) break;
        const overlap = await hasOverlap(data.appt_date, slotStart, slotEnd);
        if (!overlap) {
            const text = `INSERT INTO appointment (appt_date, start_time, end_time, appt_notes) VALUES ($1, $2, $3, $4) RETURNING *`;
            const values = [data.appt_date, slotStart, slotEnd, data.appt_notes || null];
            const { rows } = await pool.query(text, values);
            slots.push(rows[0]);
        }
        current = next;
    }
    return slots;
}

// Find appointments in a date range 
export async function findAppointmentsInDateRange(startDate: string, endDate: string) {
    const text = `SELECT * FROM appointment WHERE appt_date >= $1 AND appt_date <= $2 ORDER BY appt_date, start_time`;
    const { rows } = await pool.query(text, [startDate, endDate]);
    return rows;
}

// Find appointments in a time range 
export async function findAppointmentsInTimeRange(startTime: string, endTime: string) {
    const text = `SELECT * FROM appointment WHERE start_time >= $1::time AND end_time <= $2::time ORDER BY appt_date, start_time`;
    const { rows } = await pool.query(text, [startTime, endTime]);
    return rows;
}

// Find appointments on a date within a time range
export async function findAppointmentsInDateTimeRange(apptDate: string, startTime: string, endTime: string) {
    const text = `SELECT * FROM appointment WHERE appt_date = $1 AND start_time >= $2::time AND end_time <= $3::time ORDER BY start_time`;
    const { rows } = await pool.query(text, [apptDate, startTime, endTime]);
    return rows;
}


// Helper funciton created by GPT
async function hasOverlap(appt_date: string, start_time: string, end_time: string, excludeStart?: string): Promise<boolean> {
    let text: string;
    let values: unknown[];
    if (excludeStart) {
        text = `
            SELECT 1 FROM appointment
            WHERE appt_date = $1
              AND start_time <> $4
              AND username IS NOT NULL
              AND start_time < $3
              AND end_time > $2
            LIMIT 1
        `;
        values = [appt_date, start_time, end_time, excludeStart];
    } else {
        text = `
            SELECT 1 FROM appointment
            WHERE appt_date = $1
              AND start_time < $3
              AND end_time > $2
            LIMIT 1
        `;
        values = [appt_date, start_time, end_time];
    }
    const { rows } = await pool.query(text, values);
    return rows.length > 0;
}

// Admin Only: create an available appointment (username is null on creation meaning that no one has booked it).
export async function createAppointment(data: CreateSlotDTO) {
    const overlap = await hasOverlap(data.appt_date, data.start_time, data.end_time);
    if (overlap) {
        throw new Error("Time slot overlaps with an existing appointment");
    }

    const text = `
        INSERT INTO appointment (appt_date, start_time, end_time, appt_notes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const values = [data.appt_date, data.start_time, data.end_time, data.appt_notes];
    const { rows } = await pool.query(text, values);
    return rows[0];
}

// Admin Only: delete an appointment.
export async function deleteAppointment(appt_date: string, start_time: string) {
    const text = `
        DELETE FROM appointment
        WHERE appt_date = $1 AND start_time = $2
        RETURNING *
    `;
    const { rows } = await pool.query(text, [appt_date, start_time]);
    return rows[0] ?? null;
}

// View all appointemnts according to different filters. 
// Ai assisted
export async function getAvailableAppointments(babyOrPregnant: boolean, username?: string) {
    let text: string;
    if (babyOrPregnant) {
        const householdSize = await getHouseholdSize(username!);
        if (householdSize >= 4) {
            text = `
                SELECT * FROM appointment
                WHERE username IS NULL
                  AND EXTRACT(DOW FROM appt_date) = 3
                ORDER BY appt_date, start_time
            `;
            const { rows } = await pool.query(text);
            // Filter for only slots where two consecutive slots are available since they need 30 minutes.
            const validSlots = [];
            for (let i = 0; i < rows.length - 1; i++) {
                const curr = rows[i];
                const next = rows[i + 1];
                if (
                    curr.appt_date === next.appt_date &&
                    curr.end_time === next.start_time
                ) {
                    validSlots.push({
                        appt_date: curr.appt_date,
                        start_time: curr.start_time,
                        end_time: next.end_time,
                        appt_notes: curr.appt_notes,
                        username: null,
                        slot_pair: [curr, next]
                    });
                }
            }
            return validSlots;
        }
        // If household size < 4, show normal Wednesday slots
        text = `
            SELECT * FROM appointment
            WHERE username IS NULL
              AND EXTRACT(DOW FROM appt_date) = 3
            ORDER BY appt_date, start_time
        `;
        const { rows } = await pool.query(text);
        return rows;
    }
    // No baby and not pregnant and less than 4 household members, show all available slots
    text = `
        SELECT * FROM appointment
        WHERE username IS NULL
        ORDER BY appt_date, start_time
    `;
    const { rows } = await pool.query(text);
    return rows;
}

// Helper funciton, gets household size
export async function getHouseholdSize(username: string): Promise<number> {
    const text = `SELECT household_size FROM account WHERE username = $1`;
    const { rows } = await pool.query(text, [username]);
    return rows[0]?.household_size ?? 1;
}

// Book an available slot
// Duration: 30 min if household_size >= 4, otherwise 15 min
// The booking end_time must not overlap any other booked appointment on the same date
// the slots needed === 2 portion is ai generated 
export async function bookAppointment(data: BookAppointmentDTO, username: string) {
    const householdSize = await getHouseholdSize(username);
    const slotsNeeded = householdSize >= 4 ? 2 : 1;
    const booked = [];
    const update = `UPDATE appointment SET username = $1 WHERE appt_date = $2 AND start_time = $3 AND username IS NULL RETURNING *`;
    const { rows: first } = await pool.query(update, [username, data.appt_date, data.start_time]);
    if (!first[0]) throw new Error("Booking would overlap with an existing appointment or slot is unavailable");
    booked.push(first[0]);
    if (slotsNeeded === 2) {
        const [hour, min] = data.start_time.split(":").map(Number);
        const nextMin = min + 15;
        let nextHour = hour;
        let nextMinAdj = nextMin;
        if (nextMin >= 60) {
            nextHour += 1;
            nextMinAdj = nextMin - 60;
        }
        const nextStart = `${nextHour.toString().padStart(2, "0")}:${nextMinAdj.toString().padStart(2, "0")}`;
        const { rows: second } = await pool.query(update, [username, data.appt_date, nextStart]);
        if (!second[0]) throw new Error("Booking would overlap with an existing appointment or slot is unavailable");
        booked.push(second[0]);
    }
    return { overlap: false, appointment: booked, duration: slotsNeeded * 15 };
}

// Client: cancel their own booking (slot becomes available again)
export async function cancelBooking(appt_date: string, start_time: string, username: string) {
    const text = `
        UPDATE appointment
        SET username = NULL
        WHERE appt_date = $1 AND start_time = $2 AND username = $3
        RETURNING *
    `;
    const { rows } = await pool.query(text, [appt_date, start_time, username]);
    return rows[0] ?? null;
}

// Client: get their own booked appointments
export async function getMyAppointments(username: string) {
    const text = `
        SELECT * FROM appointment
        WHERE username = $1
        ORDER BY appt_date, start_time
    `;
    const { rows } = await pool.query(text, [username]);
    return rows;
}

// Admin: get all appointments (booked and unbooked)
export async function getAllAppointments() {
    const text = `
        SELECT * FROM appointment
        ORDER BY appt_date, start_time
    `;
    const { rows } = await pool.query(text);
    return rows;
}

// Helper: check if account has baby_or_pregnant flag
export async function hasBabyOrPregnant(username: string): Promise<boolean> {
    const text = `
        SELECT baby_or_pregnant FROM account WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0]?.baby_or_pregnant === true;
}