import pool from "../../db/postgres";
import { CreateSlotDTO, BookAppointmentDTO, CreateAppointmentsInRangeDTO } from "./appointments.dto";

export async function updateAppointment(
    appt_date: string,
    start_time: string,
    updateData: Partial<{ end_time: string; appt_notes: string; capacity: number; username: string | null }>
) {
    const { username, ...slotFields } = updateData;

    if (Object.keys(slotFields).length > 0) {
        const fields: string[] = [];
        const values: unknown[] = [appt_date, start_time];
        let idx = 3;

        for (const [key, value] of Object.entries(slotFields)) {
            fields.push(`${key} = $${idx}`);
            values.push(value);
            idx += 1;
        }

        const updateText = `
            UPDATE appointment_slot
            SET ${fields.join(", ")}
            WHERE appt_date = $1 AND start_time = $2::time
            RETURNING appt_date, start_time
        `;
        const { rows: updatedSlotRows } = await pool.query(updateText, values);
        if (!updatedSlotRows[0]) {
            return null;
        }
    }

    if (username !== undefined) {
        if (username === null || username === "") {
            await pool.query(
                `
                DELETE FROM appointment_booking
                WHERE appt_date = $1 AND start_time = $2::time
            `,
                [appt_date, start_time]
            );
        } else {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                const lockText = `
                    SELECT appt_date, start_time, end_time, capacity
                    FROM appointment_slot
                    WHERE appt_date = $1 AND start_time = $2::time
                    FOR UPDATE
                `;
                const { rows: slotRows } = await client.query(lockText, [appt_date, start_time]);
                if (!slotRows[0]) {
                    throw new Error("Requested slot does not exist.");
                }

                const slotStart = slotRows[0].start_time;
                const slotEnd = slotRows[0].end_time;

                const overlapText = `
                    SELECT 1
                    FROM appointment_booking b
                    JOIN appointment_slot s
                      ON s.appt_date = b.appt_date
                     AND s.start_time = b.start_time
                    WHERE b.username = $1
                      AND s.appt_date = $2
                      AND s.start_time < $4::time
                      AND s.end_time > $3::time
                    LIMIT 1
                `;
                const { rows: overlapRows } = await client.query(overlapText, [username, appt_date, slotStart, slotEnd]);
                if (overlapRows.length > 0) {
                    throw new Error("Booking would overlap with an existing appointment");
                }

                const capacityText = `
                    SELECT s.capacity, COUNT(b.username)::int AS booked_count
                    FROM appointment_slot s
                    LEFT JOIN appointment_booking b
                      ON b.appt_date = s.appt_date
                     AND b.start_time = s.start_time
                    WHERE s.appt_date = $1 AND s.start_time = $2::time
                    GROUP BY s.capacity
                `;
                const { rows: capRows } = await client.query(capacityText, [appt_date, start_time]);
                if (!capRows[0]) {
                    throw new Error("Requested slot does not exist.");
                }
                if (capRows[0].booked_count >= capRows[0].capacity) {
                    throw new Error("Slot is no longer available");
                }

                try {
                    await client.query(
                        `
                        INSERT INTO appointment_booking (appt_date, start_time, username)
                        VALUES ($1, $2::time, $3)
                    `,
                        [appt_date, start_time, username]
                    );
                } catch (err: any) {
                    if (err?.code === "23505") {
                        throw new Error("User already has a booking for this slot");
                    }
                    throw err;
                }

                await client.query("COMMIT");
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }
    }

    const summaryText = `
        SELECT
            s.appt_date,
            s.start_time,
            s.end_time,
            s.appt_notes,
            s.capacity,
            COUNT(b.username)::int AS booked_count,
            GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
            COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
            CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
        FROM appointment_slot s
        LEFT JOIN appointment_booking b
          ON b.appt_date = s.appt_date
         AND b.start_time = s.start_time
        WHERE s.appt_date = $1 AND s.start_time = $2::time
        GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
    `;
    const { rows: summaryRows } = await pool.query(summaryText, [appt_date, start_time]);
    return summaryRows[0] ?? null;
}

// NOTUSED
// export async function deleteAppointmentFromDate(appt_date: string) {
//     const text = `
//         DELETE FROM appointment_slot
//         WHERE appt_date = $1
//         RETURNING *
//     `;
//     const { rows } = await pool.query(text, [appt_date]);
//     return rows;
// }


export async function deleteAppointmentFromUsername(username: string) {
    const text = `
        DELETE FROM appointment_booking
        WHERE username = $1
        RETURNING *
    `;
    const { rows } = await pool.query(text, [username]);
    return rows;
}

// NOTUSED
// export async function deleteAppointmentFromUsernameDateStart(username: string, appt_date: string, start_time: string) {
//     const text = `
//         DELETE FROM appointment_booking
//         WHERE username = $1
//           AND appt_date = $2
//           AND start_time = $3::time
//         RETURNING *
//     `;
//     const { rows } = await pool.query(text, [username, appt_date, start_time]);
//     return rows[0] ?? null;
// }

// NOTUSED
// export async function findAppointmentFromApptDateAndStartTime(appt_date: string, start_time: string) {
//     const text = `
//         SELECT
//             s.appt_date,
//             s.start_time,
//             s.end_time,
//             s.appt_notes,
//             s.capacity,
//             COUNT(b.username)::int AS booked_count,
//             GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
//             COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
//             CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
//         FROM appointment_slot s
//         LEFT JOIN appointment_booking b
//           ON b.appt_date = s.appt_date
//          AND b.start_time = s.start_time
//         WHERE s.appt_date = $1 AND s.start_time = $2::time
//         GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
//     `;
//     const { rows } = await pool.query(text, [appt_date, start_time]);
//     return rows[0] ?? null;
// }

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

    const capacity = data.capacity ?? 1;
    if (capacity < 1) {
        throw new Error("capacity must be at least 1");
    }

    const slots = [];
    let current = new Date(`${data.appt_date}T${data.start_time}:00Z`);
    const end = new Date(`${data.appt_date}T${data.end_time}:00Z`);
    while (current < end) {
        const slotStart = current.toISOString().substring(11, 16);
        const next = new Date(current.getTime() + 15 * 60000);
        const slotEnd = next.toISOString().substring(11, 16);
        if (next > end) {
            break;
        }

        const overlapText = `
            SELECT 1 FROM appointment_slot
            WHERE appt_date = $1
              AND start_time < $3::time
              AND end_time > $2::time
            LIMIT 1
        `;
        const { rows: overlapRows } = await pool.query(overlapText, [data.appt_date, slotStart, slotEnd]);

        if (overlapRows.length === 0) {
            const insertText = `
                INSERT INTO appointment_slot (appt_date, start_time, end_time, appt_notes, capacity)
                VALUES ($1, $2::time, $3::time, $4, $5)
                RETURNING *
            `;
            const insertValues = [data.appt_date, slotStart, slotEnd, data.appt_notes || null, capacity];
            const { rows: insertedRows } = await pool.query(insertText, insertValues);
            slots.push(insertedRows[0]);
        }

        current = next;
    }

    return slots;
}

export async function findAppointmentsInDateRange(startDate: string, endDate: string) {
    const text = `
        SELECT
            s.appt_date,
            s.start_time,
            s.end_time,
            s.appt_notes,
            s.capacity,
            COUNT(b.username)::int AS booked_count,
            GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
            COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
            CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
        FROM appointment_slot s
        LEFT JOIN appointment_booking b
          ON b.appt_date = s.appt_date
         AND b.start_time = s.start_time
        WHERE s.appt_date >= $1 AND s.appt_date <= $2
        GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
        ORDER BY s.appt_date, s.start_time
    `;
    const { rows } = await pool.query(text, [startDate, endDate]);
    return rows;
}

// NOTUSED
// export async function findAppointmentsInTimeRange(startTime: string, endTime: string) {
//     const text = `
//         SELECT
//             s.appt_date,
//             s.start_time,
//             s.end_time,
//             s.appt_notes,
//             s.capacity,
//             COUNT(b.username)::int AS booked_count,
//             GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
//             COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
//             CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
//         FROM appointment_slot s
//         LEFT JOIN appointment_booking b
//           ON b.appt_date = s.appt_date
//          AND b.start_time = s.start_time
//         WHERE s.start_time >= $1::time AND s.end_time <= $2::time
//         GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
//         ORDER BY s.appt_date, s.start_time
//     `;
//     const { rows } = await pool.query(text, [startTime, endTime]);
//     return rows;
// }

export async function findAppointmentsInDateTimeRange(apptDate: string, startTime: string, endTime: string) {
    const text = `
        SELECT
            s.appt_date,
            s.start_time,
            s.end_time,
            s.appt_notes,
            s.capacity,
            COUNT(b.username)::int AS booked_count,
            GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
            COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
            CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
        FROM appointment_slot s
        LEFT JOIN appointment_booking b
          ON b.appt_date = s.appt_date
         AND b.start_time = s.start_time
        WHERE s.appt_date = $1 AND s.start_time >= $2::time AND s.end_time <= $3::time
        GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
        ORDER BY s.appt_date, s.start_time
    `;
    const { rows } = await pool.query(text, [apptDate, startTime, endTime]);
    return rows;
}

// NOTUSED
// export async function createAppointment(data: CreateSlotDTO) {
//     const overlapText = `
//         SELECT 1 FROM appointment_slot
//         WHERE appt_date = $1
//           AND start_time < $3::time
//           AND end_time > $2::time
//         LIMIT 1
//     `;
//     const { rows: overlapRows } = await pool.query(overlapText, [data.appt_date, data.start_time, data.end_time]);
//     if (overlapRows.length > 0) {
//         throw new Error("Time slot overlaps with an existing appointment");
//     }

//     const capacity = data.capacity ?? 1;
//     if (capacity < 1) {
//         throw new Error("capacity must be at least 1");
//     }

//     const text = `
//         INSERT INTO appointment_slot (appt_date, start_time, end_time, appt_notes, capacity)
//         VALUES ($1, $2::time, $3::time, $4, $5)
//         RETURNING *
//     `;
//     const values = [data.appt_date, data.start_time, data.end_time, data.appt_notes || null, capacity];
//     const { rows } = await pool.query(text, values);
//     return rows[0];
// }

export async function deleteAppointment(appt_date: string, start_time: string) {
    const text = `
        DELETE FROM appointment_slot
        WHERE appt_date = $1 AND start_time = $2::time
        RETURNING *
    `;
    const { rows } = await pool.query(text, [appt_date, start_time]);
    return rows[0] ?? null;
}

// NOTUSED
// export async function getAvailableAppointments(babyOrPregnant: boolean, username?: string) {
//     const rowsQuery = `
//         SELECT
//             s.appt_date,
//             s.start_time,
//             s.end_time,
//             s.appt_notes,
//             s.capacity,
//             COUNT(b.username)::int AS booked_count,
//             GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
//             COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
//             CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
//         FROM appointment_slot s
//         LEFT JOIN appointment_booking b
//           ON b.appt_date = s.appt_date
//          AND b.start_time = s.start_time
//         WHERE s.capacity > (
//             SELECT COUNT(*)::int
//             FROM appointment_booking b2
//             WHERE b2.appt_date = s.appt_date
//               AND b2.start_time = s.start_time
//         )
//         ${babyOrPregnant ? "AND EXTRACT(DOW FROM s.appt_date) = 3" : ""}
//         GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
//         ORDER BY s.appt_date, s.start_time
//     `;

//     const { rows } = await pool.query(rowsQuery);

//     if (!babyOrPregnant) {
//         return rows;
//     }

//     const householdText = `SELECT household_size FROM account WHERE username = $1`;
//     const { rows: householdRows } = await pool.query(householdText, [username]);
//     const householdSize = householdRows[0]?.household_size ?? 1;

//     if (householdSize < 5) {
//         return rows;
//     }

//     const validSlots = [];
//     for (let i = 0; i < rows.length - 1; i++) {
//         const curr = rows[i];
//         const next = rows[i + 1];
//         const currDate = String(curr.appt_date);
//         const nextDate = String(next.appt_date);
//         const currEnd = String(curr.end_time).slice(0, 5);
//         const nextStart = String(next.start_time).slice(0, 5);

//         if (currDate === nextDate && currEnd === nextStart) {
//             validSlots.push({
//                 appt_date: curr.appt_date,
//                 start_time: curr.start_time,
//                 end_time: next.end_time,
//                 appt_notes: curr.appt_notes,
//                 capacity: Math.min(curr.capacity, next.capacity),
//                 booked_count: Math.max(curr.booked_count, next.booked_count),
//                 remaining_capacity: Math.min(curr.remaining_capacity, next.remaining_capacity),
//                 usernames: Array.from(new Set([...(curr.usernames || []), ...(next.usernames || [])])),
//                 username: null,
//                 slot_pair: [curr, next],
//             });
//         }
//     }

//     return validSlots;
// }

export async function getHouseholdSize(username: string): Promise<number> {
    const text = `SELECT household_size FROM account WHERE username = $1`;
    const { rows } = await pool.query(text, [username]);
    return rows[0]?.household_size ?? 1;
}

export async function bookAppointment(data: BookAppointmentDTO, username: string) {
    const householdText = `SELECT household_size FROM account WHERE username = $1`;
    const { rows: householdRows } = await pool.query(householdText, [username]);
    const householdSize = householdRows[0]?.household_size ?? 1;
    const slotsNeeded = householdSize >= 5 ? 2 : 1;

    const [startHourRaw, startMinRaw] = String(data.start_time).split(":");
    const normalizedStart = `${String(Number(startHourRaw)).padStart(2, "0")}:${String(Number(startMinRaw)).padStart(2, "0")}`;

    const slotStarts: string[] = [normalizedStart];
    if (slotsNeeded === 2) {
        const [hour, min] = normalizedStart.split(":").map(Number);
        const totalMinutes = hour * 60 + min + 15;
        const nextHour = Math.floor(totalMinutes / 60);
        const nextMin = totalMinutes % 60;
        slotStarts.push(`${nextHour.toString().padStart(2, "0")}:${nextMin.toString().padStart(2, "0")}`);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const lockText = `
            SELECT appt_date, start_time, end_time, capacity
            FROM appointment_slot
            WHERE appt_date = $1
              AND start_time = ANY($2::time[])
            ORDER BY start_time
            FOR UPDATE
        `;
        const { rows: lockedRows } = await client.query(lockText, [data.appt_date, slotStarts]);
        if (lockedRows.length !== slotStarts.length) {
            throw new Error("One or more requested slots do not exist.");
        }

        const orderedSlots = slotStarts.map((start) => {
            const startHHmm = String(start).slice(0, 5);
            return lockedRows.find((row) => String(row.start_time).slice(0, 5) === startHHmm);
        });
        if (orderedSlots.some((slot) => !slot)) {
            throw new Error("One or more requested slots do not exist.");
        }

        const slots = orderedSlots as Array<{ appt_date: string; start_time: string; end_time: string; capacity: number }>;

        if (slotsNeeded === 2) {
            const firstEnd = String(slots[0].end_time).slice(0, 5);
            const secondStart = String(slots[1].start_time).slice(0, 5);
            if (firstEnd !== secondStart) {
                throw new Error("Both slots must be consecutive to book a 30-minute appointment (household size 5+).");
            }
        }

        const overlapText = `
            SELECT 1
            FROM appointment_booking b
            JOIN appointment_slot s
              ON s.appt_date = b.appt_date
             AND s.start_time = b.start_time
            WHERE b.username = $1
              AND s.appt_date = $2
              AND s.start_time < $4::time
              AND s.end_time > $3::time
            LIMIT 1
        `;
        const { rows: overlapRows } = await client.query(overlapText, [
            username,
            data.appt_date,
            slots[0].start_time,
            slots[slots.length - 1].end_time,
        ]);
        if (overlapRows.length > 0) {
            throw new Error("Booking would overlap with an existing appointment");
        }

        for (const slot of slots) {
            const capacityText = `
                SELECT s.capacity, COUNT(b.username)::int AS booked_count
                FROM appointment_slot s
                LEFT JOIN appointment_booking b
                  ON b.appt_date = s.appt_date
                 AND b.start_time = s.start_time
                WHERE s.appt_date = $1 AND s.start_time = $2::time
                GROUP BY s.capacity
            `;
            const { rows: capRows } = await client.query(capacityText, [data.appt_date, slot.start_time]);
            if (!capRows[0]) {
                throw new Error("Requested slot does not exist.");
            }
            if (capRows[0].booked_count >= capRows[0].capacity) {
                throw new Error("Slot is no longer available");
            }

            try {
                await client.query(
                    `
                    INSERT INTO appointment_booking (appt_date, start_time, username)
                    VALUES ($1, $2::time, $3)
                `,
                    [data.appt_date, slot.start_time, username]
                );
            } catch (err: any) {
                if (err?.code === "23505") {
                    throw new Error("User already has a booking for this slot");
                }
                throw err;
            }
        }

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

    const appointment = await Promise.all(
        slotStarts.map(async (slotStart) => {
            const summaryText = `
                SELECT
                    s.appt_date,
                    s.start_time,
                    s.end_time,
                    s.appt_notes,
                    s.capacity,
                    COUNT(b.username)::int AS booked_count,
                    GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
                    COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
                    CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
                FROM appointment_slot s
                LEFT JOIN appointment_booking b
                  ON b.appt_date = s.appt_date
                 AND b.start_time = s.start_time
                WHERE s.appt_date = $1 AND s.start_time = $2::time
                GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
            `;
            const { rows } = await pool.query(summaryText, [data.appt_date, slotStart]);
            return rows[0] ?? null;
        })
    );

    return {
        overlap: false,
        appointment: appointment.filter(Boolean),
        duration: slotsNeeded * 15,
    };
}

// NOTUSED
// export async function cancelBooking(username: string, appt_date?: string, start_time?: string) {
//     if (appt_date && start_time) {
//         const text = `
//             DELETE FROM appointment_booking
//             WHERE username = $1
//               AND appt_date = $2
//               AND start_time = $3::time
//             RETURNING *
//         `;
//         const { rows } = await pool.query(text, [username, appt_date, start_time]);
//         return rows;
//     }

//     const text = `
//         DELETE FROM appointment_booking
//         WHERE username = $1
//         RETURNING *
//     `;
//     const { rows } = await pool.query(text, [username]);
//     return rows;
// }

export async function getMyAppointments(username: string) {
    const text = `
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
    const { rows } = await pool.query(text, [username]);
    return rows;
}

// NOTUSED
// export async function getAllAppointments() {
//     const text = `
//         SELECT
//             s.appt_date,
//             s.start_time,
//             s.end_time,
//             s.appt_notes,
//             s.capacity,
//             COUNT(b.username)::int AS booked_count,
//             GREATEST(s.capacity - COUNT(b.username)::int, 0) AS remaining_capacity,
//             COALESCE(array_agg(b.username ORDER BY b.username) FILTER (WHERE b.username IS NOT NULL), '{}')::varchar[] AS usernames,
//             CASE WHEN COUNT(b.username)::int >= s.capacity THEN MAX(b.username) ELSE NULL END AS username
//         FROM appointment_slot s
//         LEFT JOIN appointment_booking b
//           ON b.appt_date = s.appt_date
//          AND b.start_time = s.start_time
//         GROUP BY s.appt_date, s.start_time, s.end_time, s.appt_notes, s.capacity
//         ORDER BY s.appt_date, s.start_time
//     `;
//     const { rows } = await pool.query(text);
//     return rows;
// }

export async function hasBabyOrPregnant(username: string): Promise<boolean> {
    const text = `
        SELECT baby_or_pregnant FROM account WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0]?.baby_or_pregnant === true;
}
