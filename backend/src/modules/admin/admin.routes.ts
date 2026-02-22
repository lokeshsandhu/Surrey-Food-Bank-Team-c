import { Router } from "express";
import * as controller from "./admin.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

// GET /api/admin/clients — list all clients
router.get("/clients", authenticate, requireAdmin, controller.getAllClients);

// GET /api/admin/clients/:username - Obtains all of a clients details including family members and appointments
router.get("/clients/:username", authenticate, requireAdmin, controller.getClientByUsername);

// GET /api/admin/appointments — list all appointments
router.get("/appointments", authenticate, requireAdmin, controller.getAllAppointments);

export default router;
