import jwt from "jsonwebtoken";
import { env } from "../../config/env";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = "24h";

export interface JwtPayload {
    username: string;
    role: string;
}

interface PasswordResetJwtPayload {
    username: string;
    type: "password-reset";
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
    const payload = jwt.verify(token, SECRET);

    if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.username !== "string" ||
        typeof payload.role !== "string"
    ) {
        throw new Error("Invalid token payload");
    }

    return {
        username: payload.username,
        role: payload.role,
    };
}

export function signPasswordResetToken(username: string): string {
    const expiresInSeconds = Math.max(1, env.PASSWORD_RESET_EXPIRES_MINUTES) * 60;
    const payload: PasswordResetJwtPayload = { username, type: "password-reset" };
    return jwt.sign(payload, SECRET, { expiresIn: expiresInSeconds });
}

export function verifyPasswordResetToken(token: string): string {
    const payload = jwt.verify(token, SECRET);

    if (
        !payload ||
        typeof payload !== "object" ||
        payload.type !== "password-reset" ||
        typeof payload.username !== "string"
    ) {
        throw new Error("Invalid reset token payload");
    }

    return payload.username;
}
