import { Request, Response } from "express";
import * as service from "./email.service";

// Send appointment booking confirmation with date and time to account owner's email
export async function sendConfirmation(req: Request, res: Response) {
    try { 
        const { date, time, username, email } = req.body;
        const dateDate = new Date(date + " " + time);
        
        const formattedDate = formatDate(dateDate);
        const formattedTime = formatTime(dateDate);

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
        const { email, link, username } = req.body;
        const result = await service.sendRecoveryMessage(email, link, username);

        if (!result) {
            res.status(400).json({ error: "Issue creating email" });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err:any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Send appointment cancelled confirmation with date and time to account owner's email
export async function sendCancellation(req: Request, res: Response) {
    try { 
        const { date, time, username, email } = req.body;
        const dateDate = new Date(date + " " + time);
        
        const formattedDate = formatDate(dateDate);
        const formattedTime = formatTime(dateDate);

        const result = await service.sendCancelMessage(formattedDate, formattedTime, username, email);

        if (!result) {
            res.status(400).json({ error: "Issue creating email" });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err:any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Send appointment edit confirmation with og date, og time, new date and new time to account owner's email
export async function sendEdit(req: Request, res: Response) {
    try { 
        const { originalDate, originalTime, date, time, username, email } = req.body;

        const originalDateDate = new Date(originalDate + " " + originalTime);
        const dateDate = new Date(date + " " + time);

        const formattedOriginalDate = formatDate(originalDateDate);
        const formattedOriginalTime = formatTime(originalDateDate);
        
        const formattedDate = formatDate(dateDate);
        const formattedTime = formatTime(dateDate);

        const result = await service.sendEditMessage(formattedOriginalDate, formattedOriginalTime, formattedDate, formattedTime, username, email);

        if (!result) {
            res.status(400).json({ error: "Issue creating email" });
            return;
        }

        res.status(200).json({ success: true });
    } catch (err:any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// helper function to format date into "Dayname, Month DD, YYYY" format
function formatDate(date: Date) {
    const dateFormatOptions: Intl.DateTimeFormatOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
    return date.toLocaleDateString(undefined, dateFormatOptions);
}

// helper function to format time into "HH:MM AM/PM" format
function formatTime(date: Date) {
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        };
    
    return date.toLocaleTimeString(undefined, timeFormatOptions);
}