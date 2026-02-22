import pool from "../../db/postgres";
import { AccountDTO, UpdateAccountDTO } from "./accounts.dto";
import { hashPassword } from "../../shared/crypto/password";
import { decryptRowFromDb, encryptForDb } from "../../shared/crypto/dbFieldEncryption";

export async function createAccount(data: AccountDTO) {
    const hashedPassword = await hashPassword(data.user_password);
    const text = `
        INSERT INTO account
        (username, user_password, canada_status, household_size, addr, baby_or_pregnant)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING username, canada_status, household_size, addr, baby_or_pregnant
    `;
    const values = [
        data.username,
        hashedPassword,
        data.canada_status,
        data.household_size,
        encryptForDb("account", "addr", data.addr),
        data.baby_or_pregnant,
    ];
    const { rows } = await pool.query(text, values);
    return decryptRowFromDb("account", rows[0]);
}

export async function getAccountByUsername(username: string) {
    const text = `
        SELECT username, canada_status, household_size, addr, baby_or_pregnant
        FROM account
        WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    const row = rows[0] ?? null;
    return row ? decryptRowFromDb("account", row) : null;
}

export async function getAccountWithPassword(username: string) {
    const text = `
        SELECT username, user_password
        FROM account
        WHERE username = $1
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0] ?? null;
}
// Only the fields you specify are updated
export async function updateAccount(username: string, data: UpdateAccountDTO) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

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
        values.push(encryptForDb("account", "addr", data.addr));
    }
    if (data.baby_or_pregnant !== undefined) {
        fields.push(`baby_or_pregnant = $${idx++}`);
        values.push(data.baby_or_pregnant);
    }

    if (fields.length === 0) {
        return getAccountByUsername(username);
    }

    values.push(username);
    const text = `
        UPDATE account
        SET ${fields.join(", ")}
        WHERE username = $${idx}
        RETURNING username, canada_status, household_size, addr, baby_or_pregnant
    `;

    const { rows } = await pool.query(text, values);
    const row = rows[0] ?? null;
    return row ? decryptRowFromDb("account", row) : null;
}

export async function deleteAccount(username: string) {
    const text = `
        DELETE FROM account
        WHERE username = $1
        RETURNING username
    `;
    const { rows } = await pool.query(text, [username]);
    return rows[0] ?? null;
}
