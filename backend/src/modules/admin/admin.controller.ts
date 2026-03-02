import { Request, Response } from "express";
import * as service from "./admin.service";

// Return all clients in database
export async function getAllClients(req: Request, res: Response) {
    try {
        const clients = await service.getAllClients();
        res.status(200).json(clients);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Return client info with given username, including familymembers and appointments
export async function getClientByUsername(req: Request, res: Response) {
    try {
        const client = await service.getClientByUsername(req.params.username);
        if (!client) {
            res.status(404).json({ error: "Client not found" });
            return;
        }
        res.status(200).json(client);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Return all appointments in database
export async function getAllAppointments(req: Request, res: Response) {
    try {
        const appointments = await service.getAllAppointments();
        res.status(200).json(appointments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
