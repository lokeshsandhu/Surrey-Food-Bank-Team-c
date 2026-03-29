import { Router } from "express";
import * as controller from "./email.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

// Send confirmation email for successful appointment bookings
router.post("/send-confirmation", authenticate, controller.sendConfirmation);

// Send recovery email to reset account password
router.post("/send-recovery", authenticate, controller.sendRecovery);

// Send confirmation email for successful booking cancellation
router.post("/send-cancel", authenticate, controller.sendCancellation);

// Send confirmation email for successful booking edit
router.post("/send-edit", authenticate, controller.sendEdit);

export default router;