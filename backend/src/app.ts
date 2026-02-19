import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes";
import accountsRoutes from "./modules/accounts/accounts.routes";
import adminRoutes from "./modules/admin/admin.routes";
import appointmentsRoutes from "./modules/appointments/appointments.routes";
import familyMembersRoutes from "./modules/familyMembers/familyMembers.routes";

import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/family-members", familyMembersRoutes);
app.use(errorHandler);

export default app;
