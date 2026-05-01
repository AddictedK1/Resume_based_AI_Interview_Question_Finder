import { Router } from "express";

import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import questionRoutes from "./questionRoutes.js";
import resumeRoutes from "./resumeRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/questions", questionRoutes);
router.use("/resume", resumeRoutes);

export default router;
