import pool from "../../db/postgres";
import { FamilyMemberDTO, UpdateFamilyMemberDTO } from "./familyMembers.dto";

// Select all rows with given first name from familymember table, return row(s)
export async function findFamilyMembersByFName(f_name: string) {
    const text = `SELECT * FROM familymember WHERE f_name = LOWER($1) ORDER BY username`;
    const { rows } = await pool.query(text, [f_name]);
    return rows;
}

// Select all rows with given last name from familymember table, return row(s)
export async function findFamilyMembersByLName(l_name: string) {
    const text = `SELECT * FROM familymember WHERE l_name = LOWER($1) ORDER BY username`;
    const { rows } = await pool.query(text, [l_name]);
    return rows;
}

// Insert row into familymember table, return row(s)
export async function createFamilyMember(data: FamilyMemberDTO) {
    const text = `
        INSERT INTO familymember
        (username, f_name, l_name, dob, phone, email, relationship)
        VALUES ($1, LOWER($2), LOWER($3), $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [
        data.username,
        data.f_name,
        data.l_name,
        data.dob,
        data.phone,
        data.email,
        data.relationship,
    ];
    const { rows } = await pool.query(text, values);
    return rows[0];
}

// Select all rows with given username from familymember table, return row(s)
export async function getFamilyMembers(username: string) {
    const text = `
        SELECT * FROM familymember
        WHERE username = $1
        ORDER BY f_name
    `;
    const { rows } = await pool.query(text, [username]);
    return rows;
}

// Update row in familymember table with given username and first name, return row
// Only the fields you specify are updated
export async function updateFamilyMember(
    username: string,
    f_name: string,
    data: UpdateFamilyMemberDTO
) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.l_name !== undefined) {
        fields.push(`l_name = LOWER($)${idx++}`);
        values.push(data.l_name);
    }
    if (data.dob !== undefined) {
        fields.push(`dob = $${idx++}`);
        values.push(data.dob);
    }
    if (data.phone !== undefined) {
        fields.push(`phone = $${idx++}`);
        values.push(data.phone);
    }
    if (data.email !== undefined) {
        fields.push(`email = $${idx++}`);
        values.push(data.email);
    }
    if (data.relationship !== undefined) {
        fields.push(`relationship = $${idx++}`);
        values.push(data.relationship);
    }

    if (fields.length === 0) {
        const { rows } = await pool.query(
            `SELECT * FROM familymember WHERE username = $1 AND f_name = LOWER($2)`,
            [username, f_name]
        );
        return rows[0] ?? null;
    }

    values.push(username, f_name);
    const text = `
        UPDATE familymember
        SET ${fields.join(", ")}
        WHERE username = $${idx} AND f_name = LOWER($)${idx + 1}
        RETURNING *
    `;
    const { rows } = await pool.query(text, values);
    return rows[0] ?? null;
}

// Delete row from familymember table with given username and first name, return row
export async function deleteFamilyMember(username: string, f_name: string) {
    const text = `
        DELETE FROM familymember
        WHERE username = $1 AND f_name = LOWER($2)
        RETURNING *
    `;
    const { rows } = await pool.query(text, [username, f_name]);
    return rows[0] ?? null;
}

// Select all rows with relationship = 'owner' from familymember table
export async function getOwnerFamilyMembers() {
    const text = `SELECT * FROM familymember WHERE relationship = 'owner' ORDER BY username, f_name`;
    const { rows } = await pool.query(text);
    return rows;
}