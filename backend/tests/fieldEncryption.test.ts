describe("field encryption", () => {
  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    jest.resetModules();
  });

  test("round-trip encrypt/decrypt works", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptString, decryptString } = require("../src/shared/crypto/fieldEncryption");
    const aad = "account.addr";
    const plaintext = "123 Main St";
    const encrypted = encryptString(plaintext, aad);
    expect(decryptString(encrypted, aad)).toBe(plaintext);
  });

  test("encrypting same value twice produces different ciphertext", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptString } = require("../src/shared/crypto/fieldEncryption");
    const aad = "account.addr";
    const plaintext = "same";
    expect(encryptString(plaintext, aad)).not.toBe(encryptString(plaintext, aad));
  });

  test("wrong AAD fails decryption", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptString, decryptString } = require("../src/shared/crypto/fieldEncryption");
    const encrypted = encryptString("x", "account.addr");
    expect(() => decryptString(encrypted, "familymember.email")).toThrow();
  });

  test("tampering fails decryption", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptString, decryptString } = require("../src/shared/crypto/fieldEncryption");
    const encrypted = encryptString("x", "account.addr");
    const parts = encrypted.split(":");
    const ct = Buffer.from(parts[4], "base64");
    ct[0] = ct[0] ^ 0xff;
    const tampered = [parts[0], parts[1], parts[2], parts[3], ct.toString("base64")].join(":");
    expect(() => decryptString(tampered, "account.addr")).toThrow();
  });

  test("plaintext passthrough on row decrypt", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { decryptRowFromDb } = require("../src/shared/crypto/dbFieldEncryption");
    const row = decryptRowFromDb("account", { addr: "hello" });
    expect(row.addr).toBe("hello");
  });

  test("policy-driven encrypt/decrypt round-trip", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ENCRYPTION_POLICY } = require("../src/shared/crypto/encryptionPolicy");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptForDb, decryptRowFromDb } = require("../src/shared/crypto/dbFieldEncryption");

    expect(ENCRYPTION_POLICY).toEqual({
      account: ["addr"],
      familymember: ["email", "phone"],
    });

    for (const [table, columns] of Object.entries(ENCRYPTION_POLICY)) {
      for (const column of columns as string[]) {
        const encrypted = encryptForDb(table, column, "value");
        expect(typeof encrypted).toBe("string");
        const decryptedRow = decryptRowFromDb(table, { [column]: encrypted });
        expect(decryptedRow[column]).toBe("value");
      }
    }
  });

  test("non-policy fields remain plaintext", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { encryptForDb } = require("../src/shared/crypto/dbFieldEncryption");
    expect(encryptForDb("familymember", "relationship", "owner")).toBe("owner");
    expect(encryptForDb("appointment", "appt_notes", "note")).toBe("note");
  });
});
