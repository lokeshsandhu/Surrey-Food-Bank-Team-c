import pool from "../../db/postgres";
import { FamilyMemberDTO, UpdateFamilyMemberDTO } from "./familyMembers.dto";


export async function findFamilyMembersByFName(f_name: string) {
    const text = `SELECT * FROM familymember WHERE f_name = $1 ORDER BY username`;
    const { rows } = await pool.query(text, [f_name]);
    return rows;
}

export async function findFamilyMembersByLName(l_name: string) {
    const text = `SELECT * FROM familymember WHERE l_name = $1 ORDER BY username`;
    const { rows } = await pool.query(text, [l_name]);
    return rows;
}
export async function createFamilyMember(data: FamilyMemberDTO) {
    const text = `
        INSERT INTO familymember
        (username, f_name, l_name, dob, phone, email, relationship)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
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

export async function getFamilyMembers(username: string) {
    const text = `
        SELECT * FROM familymember
        WHERE username = $1
        ORDER BY f_name
    `;
    const { rows } = await pool.query(text, [username]);
    return rows;
}

export async function updateFamilyMember(
    username: string,
    f_name: string,
    data: UpdateFamilyMemberDTO
) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.l_name !== undefined) {
        fields.push(`l_name = $${idx++}`);
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
            `SELECT * FROM familymember WHERE username = $1 AND f_name = $2`,
            [username, f_name]
        );
        return rows[0] ?? null;
    }

    values.push(username, f_name);
    const text = `
        UPDATE familymember
        SET ${fields.join(", ")}
        WHERE username = $${idx} AND f_name = $${idx + 1}
        RETURNING *
    `;
    const { rows } = await pool.query(text, values);
    return rows[0] ?? null;
}

export async function deleteFamilyMember(username: string, f_name: string) {
    const text = `
        DELETE FROM familymember
        WHERE username = $1 AND f_name = $2
        RETURNING *
    `;
    const { rows } = await pool.query(text, [username, f_name]);
    return rows[0] ?? null;
}
