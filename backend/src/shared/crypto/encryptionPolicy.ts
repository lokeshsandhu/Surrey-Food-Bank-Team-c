export const ENCRYPTION_POLICY = {
  account: ["addr"],
  familymember: ["email", "phone"],
} as const;

export type EncryptedTable = keyof typeof ENCRYPTION_POLICY;

export function aadFor(table: string, column: string): string {
  return `${table.toLowerCase()}.${column.toLowerCase()}`;
}

export function encryptedColumnsFor(table: string): readonly string[] {
  const key = table.toLowerCase() as EncryptedTable;
  return ENCRYPTION_POLICY[key] ?? [];
}

export function isEncryptedColumn(table: string, column: string): boolean {
  const col = column.toLowerCase();
  return encryptedColumnsFor(table).some((c) => c.toLowerCase() === col);
}
