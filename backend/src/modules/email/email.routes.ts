import { Router } from "express";
import * as controller from "./email.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

router.post("/send-confirmation", authenticate, controller.sendConfirmation);

export default router;