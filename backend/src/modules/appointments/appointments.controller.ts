import { CreateAppointmentsInRangeDTO } from "./appointments.dto";
import { Request, Response } from "express";
import * as service from "./appointments.service";

// Update an appointment
export async function updateAppointment(req: Request, res: Response) {
    try {
        const { appt_date, start_time, updateData } = req.body;
        const updated = await service.updateAppointment(appt_date, start_time, updateData);
        if (!updated) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Update an appointment's booking notes
export async function updateBookingNotes(req: Request, res: Response) {
    try {
        const { appt_date, start_time, username, bookingNotes } = req.body;
        const updated = await service.updateBookingNotes(appt_date, start_time, username, bookingNotes);
        if (!updated) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Delete appointments by username
export async function deleteAppointmentFromUsername(req: Request, res: Response) {
    try {
        const { username } = req.body;
        const deleted = await service.deleteAppointmentFromUsername(username);
        res.status(200).json({ deleted });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Admin: delete past appointment slots
export async function cleanupPastAppointments(req: Request, res: Response) {
    try {
        const result = await service.cleanupPastAppointments();
        res.status(200).json({ success: true, ...result });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Admin: create multiple appointments in a time range
export async function createAppointmentsInTimeRange(req: Request, res: Response) {
    try {
        const appointments = await service.createAppointmentsInTimeRange(req.body as CreateAppointmentsInRangeDTO);
        res.status(201).json({ success: true, appointments });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Gets appointments that start in the given date range, regardless of date
export async function getAppointmentsInDateRange(req: Request, res: Response) {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            res.status(400).json({ error: "start and end query params required" });
            return;
        }
        const results = await service.findAppointmentsInDateRange(String(start), String(end));
        res.status(200).json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Gets appointments that overlap with the given date and time range
export async function getAppointmentsInDateTimeRange(req: Request, res: Response) {
    try {
        const { date, start, end } = req.query;
        if (!date || !start || !end) {
            res.status(400).json({ error: "date, start, and end query params required" });
            return;
        }
        const results = await service.findAppointmentsInDateTimeRange(String(date), String(start), String(end));
        res.status(200).json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Admin: delete an appointment
export async function deleteAppointment(req: Request, res: Response) {
    try {
        const { appt_date, start_time } = req.body;
        const deleted = await service.deleteAppointment(appt_date, start_time);
        if (!deleted) {
            res.status(404).json({ success: false, error: "Appointment not found" });
            return;
        }
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Admin: get a user's booked appointments
export async function getUsernameAppointments(req: Request, res: Response) {
    try {
        const username = req.params.username;
        const appointments = await service.getMyAppointments(username);
        res.status(200).json(appointments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Client: book an available slot, also checks if they have a baby or pregnant member and enforces Wednesday bookings.
export async function bookAppointment(req: Request, res: Response) {
    try {
        const username = req.user!.username;

        const babyOrPregnant = await service.hasBabyOrPregnant(username);
        if (babyOrPregnant) {
            const slotDate = new Date(req.body.appt_date);
            if (slotDate.getUTCDay() !== 3) {
                res.status(400).json({
                    success: false,
                    error: "Families with a baby or pregnant member can only book Wednesday appointments"
                });
                return;
            }
        }

        const result = await service.bookAppointment(req.body, username);
        if (!result) {
            res.status(409).json({ success: false, error: "Slot is no longer available" });
            return;
        }
        if (result.overlap) {
            res.status(409).json({ success: false, error: "Booking would overlap with an existing appointment" });
            return;
        }

        res.status(200).json({ success: true, appointment: result.appointment, duration: result.duration });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Client: get their own booked appointments
export async function getMyAppointments(req: Request, res: Response) {
    try {
        const username = req.user!.username;
        const appointments = await service.getMyAppointments(username);
        res.status(200).json(appointments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
