import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envFileCandidates = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), "db/dev.env"),
  path.resolve(__dirname, "../../db/dev.env"),
].filter((value): value is string => Boolean(value));

for (const envFile of envFileCandidates) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

function parseBoolean(value: string | undefined) {
  return value === "true";
}

function parseOrigins(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  PORT: parseInt(process.env.PORT || process.env.SERVER_PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-me",
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN),
  DATABASE_URL: process.env.DATABASE_URL || "",
  DB_SSL: parseBoolean(process.env.DB_SSL),
  DB_USER: process.env.DB_USER || process.env.USER || "",
  DB_HOST: process.env.DB_HOST || process.env.HOST || "",
  DB_NAME: process.env.DB_NAME || process.env.DATABASE || "",
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.PASSWORD || "",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
};
