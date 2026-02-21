import { Router } from "express";
import * as controller from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();
// login and recieve jwt token
router.post("/login", controller.login);
// check if the token is valid and get user info
router.post("/me", authenticate, controller.me);

export default router;
