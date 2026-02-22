import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../db/dev.env") });

function validateFieldEncryptionKey(key: string, nodeEnv: string) {
  if (!key) {
    if (nodeEnv !== "development" && nodeEnv !== "test") {
      throw new Error("Missing FIELD_ENCRYPTION_KEY");
    }
    return;
  }

  const decoded = Buffer.from(key, "base64");
  if (decoded.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must be base64 for exactly 32 bytes");
  }
}

export const env = {
  PORT: parseInt(process.env.SERVER_PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY || "",
};

validateFieldEncryptionKey(env.FIELD_ENCRYPTION_KEY, env.NODE_ENV);
