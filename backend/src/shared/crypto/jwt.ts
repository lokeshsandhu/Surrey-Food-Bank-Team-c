import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = "24h";

export interface JwtPayload {
    username: string;
    role: string;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, SECRET) as JwtPayload;
}
