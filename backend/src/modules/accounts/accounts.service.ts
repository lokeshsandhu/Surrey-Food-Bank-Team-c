import pool from "../../db/postgres";
import { AccountDTO, UpdateAccountDTO } from "./accounts.dto";
import { hashPassword } from "../../shared/crypto/password";

// Insert a new row into account table with given info, return row
export async function createAccount(data: AccountDTO) {
    const hashedPassword = await hashPassword(data.user_password);
    const text = `
        INSERT INTO account
        (username, user_password, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING username, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes
    `;
    const values = [
        data.username,
        hashedPassword,
        data.canada_status,
        data.household_size,
        data.addr,
        data.baby_or_pregnant,
        data.language_spoken,
        data.account_notes
    ];
    const { rows } = await pool.query(text, values);
    return rows[0];
}

// Select from account table with given username, return row
export async function getAccountByUsername(username: string) {
    const text = `
        SELECT *
        FROM account
        WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0] ?? null;
}

// Select from account table join family member with given username, return owner's email
export async function getAccountEmail(username: string) {
    const text = `
        SELECT email
                FROM familymember
                WHERE username = $1
                    AND LOWER(TRIM(COALESCE(relationship, ''))) = 'owner'
                    AND email IS NOT NULL
                    AND TRIM(email) <> ''
                ORDER BY id ASC
                LIMIT 1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0] ?? null;
}

// Select from account table with given username, return boolean
export async function usernameExists(username: string): Promise<boolean> {
    const text = `SELECT 1 FROM account WHERE username = $1 LIMIT 1`;
    const { rows } = await pool.query(text, [username]);
    return rows.length > 0;
}

type EmailExistsResult = {
    exists: boolean;
    is_family_member: boolean | null;
};

// Select from family member email with given email and optionally compare against a specific member
export async function emailExists(
    email: string,
    username?: string | null,
    familyMemberId?: number | null
): Promise<EmailExistsResult> {
    const normalizedEmail = email.trim();
    if (normalizedEmail.length === 0) {
        return { exists: false, is_family_member: null };
    }

    const text = `
        SELECT username, id
        FROM familymember
        WHERE email IS NOT NULL
          AND LOWER(TRIM(email)) = LOWER(TRIM($1))
    `;
    const { rows } = await pool.query(text, [normalizedEmail]);
    if (rows.length === 0) {
        return { exists: false, is_family_member: null };
    }

    const normalizedUsername = username?.trim();
    if (!normalizedUsername || familyMemberId == null) {
        return { exists: true, is_family_member: null };
    }

    const isFamilyMember = rows.some(
        (row) => row.username === normalizedUsername && Number(row.id) === familyMemberId
    );

    return { exists: true, is_family_member: isFamilyMember };
}

// Select from account table with given username, return username and password
export async function getAccountWithPassword(username: string) {
    const text = `
        SELECT username, user_password
        FROM account
        WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0] ?? null;
}

// Update password hash for account with given username
export async function updateAccountPassword(username: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword);
    const text = `
        UPDATE account
        SET user_password = $1
        WHERE username = $2
        RETURNING username
    `;
    const { rows } = await pool.query(text, [hashedPassword, username]);
    return rows.length > 0;
}

// Update row in account table with given username, return row
// Only the fields you specify are updated
export async function updateAccount(username: string, data: UpdateAccountDTO) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.username !== undefined) {
        fields.push(`username = $${idx++}`);
        values.push(data.username);
    }
    if (data.canada_status !== undefined) {
        fields.push(`canada_status = $${idx++}`);
        values.push(data.canada_status);
    }
    if (data.household_size !== undefined) {
        fields.push(`household_size = $${idx++}`);
        values.push(data.household_size);
    }
    if (data.addr !== undefined) {
        fields.push(`addr = $${idx++}`);
        values.push(data.addr);
    }
    if (data.baby_or_pregnant !== undefined) {
        fields.push(`baby_or_pregnant = $${idx++}`);
        values.push(data.baby_or_pregnant);
    }
    if (data.language_spoken !== undefined) {
        fields.push(`language_spoken = $${idx++}`);
        values.push(data.language_spoken);
    }
    if (data.account_notes !== undefined) {
        fields.push(`account_notes = $${idx++}`);
        values.push(data.account_notes);
    }

    if (fields.length === 0) {
        return getAccountByUsername(username);
    }

    values.push(username);
    const text = `
        UPDATE account
        SET ${fields.join(", ")}
        WHERE username = $${idx}
        RETURNING username, canada_status, household_size, addr, baby_or_pregnant, language_spoken, account_notes
    `;

    const { rows } = await pool.query(text, values);
    return rows[0] ?? null;
}
