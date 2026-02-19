import { Request, Response } from "express";
import * as service from "./accounts.service";

export async function createAccount(req: Request, res: Response) {
    try {
        const account = await service.createAccount(req.body);
        res.status(201).json(account);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

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

export async function deleteAccount(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const deleted = await service.deleteAccount(username);
        if (!deleted) {
            res.status(404).json({ error: "Account not found" });
            return;
        }
        res.status(200).json({ message: "Account deleted", username: deleted.username });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
