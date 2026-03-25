import { CreateAppointmentsInRangeDTO } from "./appointments.dto";
import { Request, Response } from "express";
import * as service from "./appointments.service";

// User: Client version of updating an appointment, it simply deletes the old appointment and books the new one
export async function updateMyAppointment(req: Request, res: Response) {
    try {
        const username = req.user!.username;
        const { appt_date, start_time, newAppointment } = req.body;
        const cancelled = await service.cancelBooking(username, appt_date, start_time);
        if (!cancelled || cancelled.length === 0) {
            res.status(404).json({ success: false, error: "Current appointment not found or not yours" });
            return;
        }
        const result = await service.bookAppointment(newAppointment, username);
        if (!result || result.overlap) {
            res.status(409).json({ success: false, error: "Could not book new appointment (may overlap or be unavailable)" });
            return;
        }
        res.status(200).json({ success: true, appointment: result.appointment, duration: result.duration });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}

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

// Delete appointments by date
export async function deleteAppointmentFromDate(req: Request, res: Response) {
    try {
        const { appt_date } = req.body;
        const deleted = await service.deleteAppointmentFromDate(appt_date);
        res.status(200).json({ deleted });
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

// Delete appointment by username, date, and start_time
export async function deleteAppointmentFromUsernameDateStart(req: Request, res: Response) {
    try {
        const { username, appt_date, start_time } = req.body;
        const deleted = await service.deleteAppointmentFromUsernameDateStart(username, appt_date, start_time);
        if (!deleted) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }
        res.status(200).json({ deleted });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Find appointment by appt_date and start_time
export async function findAppointmentFromApptDateAndStartTime(req: Request, res: Response) {
    try {
        const { appt_date, start_time } = req.query;
        const found = await service.findAppointmentFromApptDateAndStartTime(String(appt_date), String(start_time));
        if (!found) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }
        res.status(200).json(found);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
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

// Gets appointments that overlap with the given time range, regardless of date
export async function getAppointmentsInTimeRange(req: Request, res: Response) {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            res.status(400).json({ error: "start and end query params required" });
            return;
        }
        const results = await service.findAppointmentsInTimeRange(String(start), String(end));
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


// Admin: create an available appointment
export async function createAppointment(req: Request, res: Response) {
    try {
        const appointment = await service.createAppointment(req.body);
        res.status(201).json({ success: true, appointment });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
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

// Admin: view all appointment slots
export async function getAllAppointments(req: Request, res: Response) {
    try {
        const appointments = await service.getAllAppointments();
        res.status(200).json(appointments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Client: get available slots
// Checks baby_or_pregnant flag — if true, only Wednesday slots are returned
export async function getAvailableAppointments(req: Request, res: Response) {
    try {
        const username = req.user!.username;
        const babyOrPregnant = await service.hasBabyOrPregnant(username);
        const appointments = await service.getAvailableAppointments(babyOrPregnant, username);
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

// Client: cancel their own booking
export async function cancelBooking(req: Request, res: Response) {
    try {
        const username = req.user!.username;
        const { appt_date, start_time } = req.body;
        const cancelled = await service.cancelBooking(username, appt_date, start_time);
        if (!cancelled || cancelled.length === 0) {
            res.status(404).json({ success: false, error: "Appointment not found or not yours" });
            return;
        }
        res.status(200).json({ success: true });
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