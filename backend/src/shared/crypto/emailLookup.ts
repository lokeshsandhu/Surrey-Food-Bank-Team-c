import crypto from "crypto";

export function normalizeEmailForLookup(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function hashEmailForLookup(value: unknown): string | null {
  const normalized = normalizeEmailForLookup(value);
  if (!normalized) {
    return null;
  }

  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}
