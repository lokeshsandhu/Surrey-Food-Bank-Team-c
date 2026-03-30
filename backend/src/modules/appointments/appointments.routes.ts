

import { Router } from "express";
import * as controller from "./appointments.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";


const router = Router();

// Get appointments in a date range
router.get("/search/date-range", authenticate, controller.getAppointmentsInDateRange);
// Get appointments in a time range NOTUSED
// router.get("/search/time-range", authenticate, controller.getAppointmentsInTimeRange);
// Get appointments in a date and time range
router.get("/search/date-time-range", authenticate, controller.getAppointmentsInDateTimeRange);

// Admin routes (You have to login under one of the usernames in the ADMIN_USERNAMES in auth.service.ts )

// Create multiple appointments in a time range 
router.post("/appointments-in-range", authenticate, requireAdmin, controller.createAppointmentsInTimeRange);
// Create a single appointment NOTUSED
// router.post("/appointment", authenticate, requireAdmin, controller.createAppointment);
// Delete a single appointment
router.delete("/appointment", authenticate, requireAdmin, controller.deleteAppointment);
// Get all appointments (admin view) NOTUSED
// router.get("/all", authenticate, requireAdmin, controller.getAllAppointments);
// Update an appointment (admin)
router.patch("/update", authenticate, requireAdmin, controller.updateAppointment);
// Delete appointments by date (admin) NOTUSED
// router.delete("/delete/date", authenticate, requireAdmin, controller.deleteAppointmentFromDate);
// Delete appointments by username (admin)
 router.delete("/delete/username", authenticate, controller.deleteAppointmentFromUsername);
// Delete appointment by username, date, and start_time (admin) NOTUSED
// router.delete("/delete/username-date-start", authenticate, requireAdmin, controller.deleteAppointmentFromUsernameDateStart);
// Find appointment by date and start_time (admin) NOTUSED
// router.get("/find/date-start", authenticate, requireAdmin, controller.findAppointmentFromApptDateAndStartTime);

// Client routes
// Get available appointments for booking NOTUSED
// router.get("/available", authenticate, controller.getAvailableAppointments);
// Book an appointment
router.post("/book", authenticate, controller.bookAppointment);
// Cancel a booked appointment NOTUSED
// router.post("/cancel", authenticate, controller.cancelBooking);
// Get the user's own booked appointments
router.get("/mine", authenticate, controller.getMyAppointments);
// User updates their own appointment (cancel and rebook) NOTUSED
// router.post("/update-mine", authenticate, controller.updateMyAppointment);

export default router;
