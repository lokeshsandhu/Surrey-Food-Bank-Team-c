import { Request, Response } from "express";
import * as service from "./accounts.service";

// Create a new account
export async function createAccount(req: Request, res: Response) {
    try {
        const account = await service.createAccount(req.body);
        res.status(201).json(account);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Find account with given username
export async function getMyAccount(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const account = await service.getAccountByUsername(username);
        if (!account) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        res.status(200).json(account);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Find email from account with given username
export async function getAccountEmail(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const account = await service.getAccountEmail(username);
        if (!account) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        res.status(200).json(account);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Update select fields in account with given username
export async function updateMyAccount(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const updated = await service.updateAccount(username, req.body);
        if (!updated) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Check if account with given username already exists
export async function checkUsernameExists(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const exists = await service.usernameExists(username);
        res.status(200).json({ exists });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Written with the assistance of ChatGPT
export async function checkEmailExists(req: Request, res: Response) {
    try {
        const { email } = req.params;
        const username = typeof req.query.username === "string" ? req.query.username : null;
        const familyMemberId =
            typeof req.query.family_member_id === "string" && req.query.family_member_id.trim() !== ""
                ? Number(req.query.family_member_id)
                : null;

        const result = await service.emailExists(
            email,
            username,
            Number.isFinite(familyMemberId) ? familyMemberId : null
        );
        res.status(200).json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
