import { Request, Response } from "express";
import * as service from "./email.service";

// Send appointment booking confirmation with date and time to account owner's email
export async function sendConfirmation(req: Request, res: Response) {
    try { 
        const { date, time, username, email } = req.body;
        const dateDate = new Date(date + " " + time);
        const dateFormatOptions: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const timeFormatOptions: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }

        const formattedDate = dateDate.toLocaleDateString(undefined, dateFormatOptions);
        const formattedTime = dateDate.toLocaleTimeString(undefined, timeFormatOptions);

        const result = await service.sendConfirmMessage(formattedDate, formattedTime, username, email);

        if (!result) {
            res.status(400).json({ error: "Issue creating email" });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err:any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Send recovery email with unique password reset link to set new account password
export async function sendRecovery(req: Request, res: Response) {
    try { 
        const { email, link } = req.body;
        const result = await service.sendRecoveryMessage(email, link);

        if (!result) {
            res.status(400).json({ error: "Issue creating email" });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err:any) {
        res.status(500).json({ success: false, error: err.message });
    }
};