

import { Router } from "express";
import * as controller from "./appointments.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";


const router = Router();

// Get appointments in a date range
router.get("/search/date-range", authenticate, controller.getAppointmentsInDateRange);
// Get appointments in a date and time range
router.get("/search/date-time-range", authenticate, controller.getAppointmentsInDateTimeRange);

// Admin routes (You have to login under one of the usernames in the ADMIN_USERNAMES in auth.service.ts )

// Create multiple appointments in a time range 
router.post("/appointments-in-range", authenticate, requireAdmin, controller.createAppointmentsInTimeRange);
// Delete a single appointment
router.delete("/appointment", authenticate, requireAdmin, controller.deleteAppointment);
// Update an appointment (admin)
router.patch("/update", authenticate, requireAdmin, controller.updateAppointment);
// Delete appointments by username (admin)
 router.delete("/delete/username", authenticate, controller.deleteAppointmentFromUsername);

// Client routes
// Book an appointment
router.post("/book", authenticate, controller.bookAppointment);
// Get the user's own booked appointments
router.get("/mine", authenticate, controller.getMyAppointments);

export default router;
