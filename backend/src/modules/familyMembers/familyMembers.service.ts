import pool from "../../db/postgres";
import { FamilyMemberDTO, UpdateFamilyMemberDTO } from "./familyMembers.dto";

function buildFamilyMemberLookupClause(identifier: number | string, startIndex = 1) {
    if (typeof identifier === "number") {
        return {
            clause: `username = $${startIndex} AND id = $${startIndex + 1}`,
            values: [identifier],
        };
    }

    return {
        clause: `username = $${startIndex} AND LOWER(f_name) = LOWER($${startIndex + 1})`,
        values: [identifier],
    };
}

// Select all rows with given first name from familymember table, return row(s)
export async function findFamilyMembersByFName(f_name: string) {
    const text = `
        SELECT * FROM familymember
        WHERE f_name ILIKE '%' || TRIM($1) || '%'
        ORDER BY username, f_name
    `;
    const { rows } = await pool.query(text, [f_name]);
    return rows;
}

// Select all rows with given last name from familymember table, return row(s)
export async function findFamilyMembersByLName(l_name: string) {
    const text = `
        SELECT * FROM familymember
        WHERE l_name ILIKE '%' || TRIM($1) || '%'
        ORDER BY username, l_name, f_name
    `;
    const { rows } = await pool.query(text, [l_name]);
    return rows;
}

// Insert row into familymember table, return row(s)
export async function createFamilyMember(data: FamilyMemberDTO) {
    // const duplicateCheck = await pool.query(
    //     `
    //         SELECT 1
    //         FROM familymember
    //         WHERE username = $1 AND LOWER(f_name) = LOWER($2)
    //         LIMIT 1
    //     `,
    //     [data.username, data.f_name]
    // );

    // if (duplicateCheck.rows.length > 0) {
    //     throw new Error("Family member with this first name already exists for the account");
    // }

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
    identifier: number | string,
    data: UpdateFamilyMemberDTO
) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.f_name !== undefined) {
        fields.push(`f_name = LOWER($${idx++})`);
        values.push(data.f_name);
    }
    if (data.l_name !== undefined) {
        fields.push(`l_name = LOWER($${idx++})`);
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
        const lookup = buildFamilyMemberLookupClause(identifier);
        const { rows } = await pool.query(
            `SELECT * FROM familymember WHERE ${lookup.clause}`,
            [username, ...lookup.values]
        );
        return rows[0] ?? null;
    }

    const lookup = buildFamilyMemberLookupClause(identifier, idx);
    values.push(username, ...lookup.values);
    const text = `
        UPDATE familymember
        SET ${fields.join(", ")}
        WHERE ${lookup.clause}
        RETURNING *
    `;
    const { rows } = await pool.query(text, values);
    return rows[0] ?? null;
}

// Delete row from familymember table with given username and identifier, return row
export async function deleteFamilyMember(username: string, identifier: number | string) {
    const lookup = buildFamilyMemberLookupClause(identifier);
    const text = `
        DELETE FROM familymember
        WHERE ${lookup.clause}
        RETURNING *
    `;
    const { rows } = await pool.query(text, [username, ...lookup.values]);
    return rows[0] ?? null;
}

// Select all rows with relationship = 'owner' from familymember table
export async function getOwnerFamilyMembers() {
    const text = `SELECT * FROM familymember WHERE relationship = 'owner' ORDER BY username, f_name`;
    const { rows } = await pool.query(text);
    return rows;
}

// Select owner email for a username, return first non-empty email or null
export async function getOwnerEmailByUsername(username: string): Promise<string | null> {
    const text = `
        SELECT email
        FROM familymember
        WHERE username = $1
          AND LOWER(COALESCE(relationship, '')) = 'owner'
          AND email IS NOT NULL
          AND TRIM(email) <> ''
        ORDER BY id ASC
        LIMIT 1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0]?.email ?? null;
}

// Select from familymember table with given username and identifier, return boolean
export async function usernameFamilyMemberExists(username: string, identifier: number | string): Promise<boolean> {
    const lookup = buildFamilyMemberLookupClause(identifier);
    const text = `SELECT * FROM familymember WHERE ${lookup.clause}`;
    const { rows } = await pool.query(text, [username, ...lookup.values]);
    return rows.length > 0;
}
