import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../shared/crypto/jwt";

// authenticates access for valid token holders
export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    const token = header.split(" ")[1];
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}

// authenticates access for admin roles
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
    }
    next();
}
