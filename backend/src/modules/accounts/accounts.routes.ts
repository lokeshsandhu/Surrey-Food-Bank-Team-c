import { Router } from "express";
import * as controller from "./accounts.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

// POST /api/accounts — create a new account 
router.post("/", controller.createAccount);

// GET /api/accounts/email/:username — get account owner's email
router.get("/email/:username", authenticate, controller.getAccountEmail);

// GET /api/accounts/:username — get account details
router.get("/:username", authenticate, controller.getMyAccount);

// PATCH /api/accounts/:username — update a specific detail
router.patch("/:username", authenticate, controller.updateMyAccount);

// DELETE /api/accounts/:username — delete account (admin only)
router.delete("/:username", authenticate, requireAdmin, controller.deleteAccount);

// GET /api/accounts/exists/:username — check if username exists
router.get("/exists/:username", controller.checkUsernameExists);

// GET /api/accounts/email-exists/:email — check if a registration email exists
router.get("/email-exists/:email", controller.checkEmailExists);

export default router;
