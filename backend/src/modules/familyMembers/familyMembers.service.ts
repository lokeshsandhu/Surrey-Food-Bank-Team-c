import pool from "../../db/postgres";
import { FamilyMemberDTO, UpdateFamilyMemberDTO } from "./familyMembers.dto";
import { decryptRowFromDb, decryptValueFromDb, encryptForDb } from "../../shared/crypto/dbFieldEncryption";
import { hashEmailForLookup } from "../../shared/crypto/emailLookup";
import { isAdminUsername } from "../../shared/auth/adminUsers";

const FAMILY_MEMBER_PUBLIC_COLUMNS = "id, username, f_name, l_name, dob, phone, email, relationship";

function normalizeRelationshipValue(value: unknown): string {
    const decrypted = decryptValueFromDb("familymember", "relationship", value);
    return typeof decrypted === "string" ? decrypted : "";
}

function normalizeFamilyMemberRow<T extends Record<string, any>>(row: T): T {
    const decryptedRow = decryptRowFromDb("familymember", row) as Record<string, any>;
    if ("relationship" in decryptedRow) {
        decryptedRow.relationship = normalizeRelationshipValue(decryptedRow.relationship);
    }
    return decryptedRow as T;
}

function normalizeFamilyMemberRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.map((row) => normalizeFamilyMemberRow(row));
}

function isOwnerRelationship(value: unknown): boolean {
    return normalizeRelationshipValue(value).trim().toLowerCase() === "owner";
}

async function syncHouseholdSize(username: string) {
    const countText = `
        SELECT COUNT(*)::int AS household_size
        FROM familymember
        WHERE username = $1
    `;
    const countResult = await pool.query(countText, [username]);
    const householdSize = countResult.rows[0]?.household_size ?? 0;

    const updateText = `
        UPDATE account
        SET household_size = $1
        WHERE username = $2
    `;
    await pool.query(updateText, [householdSize, username]);
}

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
        SELECT ${FAMILY_MEMBER_PUBLIC_COLUMNS} FROM familymember
        WHERE f_name ILIKE '%' || TRIM($1) || '%'
        ORDER BY username, f_name
    `;
    const { rows } = await pool.query(text, [f_name]);
    return normalizeFamilyMemberRows(rows);
}

// Select all rows with given last name from familymember table, return row(s)
export async function findFamilyMembersByLName(l_name: string) {
    const text = `
        SELECT ${FAMILY_MEMBER_PUBLIC_COLUMNS} FROM familymember
        WHERE l_name ILIKE '%' || TRIM($1) || '%'
        ORDER BY username, l_name, f_name
    `;
    const { rows } = await pool.query(text, [l_name]);
    return normalizeFamilyMemberRows(rows);
}

// Insert row into familymember table, return row(s)
export async function createFamilyMember(data: FamilyMemberDTO) {
    const emailLookupHash = hashEmailForLookup(data.email);
    const text = `
        INSERT INTO familymember
        (username, f_name, l_name, dob, phone, email, relationship, email_lookup_hash)
        VALUES ($1, LOWER($2), LOWER($3), $4, $5, $6, $7, $8)
        RETURNING ${FAMILY_MEMBER_PUBLIC_COLUMNS}
    `;
    const values = [
        data.username,
        data.f_name,
        data.l_name,
        data.dob,
        encryptForDb("familymember", "phone", data.phone),
        encryptForDb("familymember", "email", data.email),
        data.relationship,
        emailLookupHash,
    ];
    const { rows } = await pool.query(text, values);
    await syncHouseholdSize(data.username);
    return rows[0] ? normalizeFamilyMemberRow(rows[0]) : null;
}

// Select all rows with given username from familymember table, return row(s)
export async function getFamilyMembers(username: string) {
    const text = `
        SELECT ${FAMILY_MEMBER_PUBLIC_COLUMNS} FROM familymember
        WHERE username = $1
        ORDER BY f_name
    `;
    const { rows } = await pool.query(text, [username]);
    return normalizeFamilyMemberRows(rows);
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
        values.push(encryptForDb("familymember", "phone", data.phone));
    }
    if (data.email !== undefined) {
        fields.push(`email = $${idx++}`);
        values.push(encryptForDb("familymember", "email", data.email));
        fields.push(`email_lookup_hash = $${idx++}`);
        values.push(hashEmailForLookup(data.email));
    }
    if (data.relationship !== undefined) {
        fields.push(`relationship = $${idx++}`);
        values.push(data.relationship);
    }

    if (fields.length === 0) {
        const lookup = buildFamilyMemberLookupClause(identifier);
        const { rows } = await pool.query(
            `SELECT ${FAMILY_MEMBER_PUBLIC_COLUMNS} FROM familymember WHERE ${lookup.clause}`,
            [username, ...lookup.values]
        );
        return rows[0] ? normalizeFamilyMemberRow(rows[0]) : null;
    }

    const lookup = buildFamilyMemberLookupClause(identifier, idx);
    values.push(username, ...lookup.values);
    const text = `
        UPDATE familymember
        SET ${fields.join(", ")}
        WHERE ${lookup.clause}
        RETURNING ${FAMILY_MEMBER_PUBLIC_COLUMNS}
    `;
    const { rows } = await pool.query(text, values);
    return rows[0] ? normalizeFamilyMemberRow(rows[0]) : null;
}

// Delete row from familymember table with given username and identifier, return row
export async function deleteFamilyMember(username: string, identifier: number | string) {
    const lookup = buildFamilyMemberLookupClause(identifier);
    const text = `
        DELETE FROM familymember
        WHERE ${lookup.clause}
        RETURNING ${FAMILY_MEMBER_PUBLIC_COLUMNS}
    `;
    const { rows } = await pool.query(text, [username, ...lookup.values]);
    if (rows[0]) {
        await syncHouseholdSize(username);
    }
    return rows[0] ? normalizeFamilyMemberRow(rows[0]) : null;
}

// Select all rows with relationship = 'owner' from familymember table
export async function getOwnerFamilyMembers() {
    const text = `SELECT ${FAMILY_MEMBER_PUBLIC_COLUMNS} FROM familymember ORDER BY username, f_name`;
    const { rows } = await pool.query(text);
    return normalizeFamilyMemberRows(rows).filter(
        (member) => isOwnerRelationship(member.relationship) && !isAdminUsername(member.username)
    );
}

// Select owner email for a username, return first non-empty email or null
export async function getOwnerEmailByUsername(username: string): Promise<string | null> {
    const text = `
        SELECT email, relationship
        FROM familymember
        WHERE username = $1
        ORDER BY id ASC
    `;
    const { rows } = await pool.query(text, [username]);
    const owner = normalizeFamilyMemberRows(rows).find(
        (member) => isOwnerRelationship(member.relationship) && member.email != null && String(member.email).trim() !== ""
    );
    return owner?.email ?? null;
}
