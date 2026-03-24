import { Request, Response } from "express";
import * as service from "./email.service";

export async function sendConfirmation(req: Request, res: Response) {
    try { 
        const { date, time, username, email } = req.body;
        const dateDate = new Date(date);
        const timeDate = new Date(time);
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
            dayPeriod: "short"

        }

        const formattedDate = dateDate.toLocaleDateString("en-US", dateFormatOptions);
        const formattedTime = timeDate.toLocaleTimeString("en-US", timeFormatOptions);

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