import { Request, Response } from "express";
import * as service from "./auth.service";

// Verify login credentials and level of access
export async function login(req: Request, res: Response) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ success: false, error: "Username and password required" });
            return;
        }

        const result = await service.login({ username, password });
        if (!result) {
            res.status(401).json({ success: false, error: "Invalid username or password" });
            return;
        }

        res.status(200).json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Call this in the frontend to check the user's role, we can the display an admin page or client page depending on it.
export async function me(req: Request, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        res.status(200).json({
            username: req.user.username,
            role: req.user.role,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
