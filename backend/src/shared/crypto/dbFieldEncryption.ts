import { aadFor, encryptedColumnsFor, isEncryptedColumn } from "./encryptionPolicy";
import { decryptString, encryptString, isEncryptedValue } from "./fieldEncryption";

export function encryptForDb(table: string, column: string, value: unknown): unknown {
  if (!isEncryptedColumn(table, column)) return value;
  if (value === null || value === undefined) return value;
  if (isEncryptedValue(value)) return value;
  if (typeof value !== "string") {
    throw new Error(`Cannot encrypt non-string value for ${table}.${column}`);
  }

  return encryptString(value, aadFor(table, column));
}

export function decryptRowFromDb<T extends Record<string, any>>(table: string, row: T): T {
  const decrypted: Record<string, any> = { ...row };
  for (const column of encryptedColumnsFor(table)) {
    if (!(column in decrypted)) continue;
    decrypted[column] = decryptValueFromDb(table, column, decrypted[column]);
  }
  return decrypted as T;
}

export function decryptRowsFromDb<T extends Record<string, any>>(table: string, rows: T[]): T[] {
  return rows.map((r) => decryptRowFromDb(table, r));
}

export function decryptValueFromDb(table: string, column: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "string") return value;
  return decryptString(value, aadFor(table, column));
}
