import { Router } from "express";
import * as controller from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
// login and recieve jwt token
router.post("/login", controller.login);
// check if the token is valid and get user info
router.post("/me", authenticate, controller.me);
// request password reset email
router.post("/password-reset/request", controller.requestPasswordReset);
// reset password using token from email
router.post("/password-reset/confirm", controller.confirmPasswordReset);

export default router;
