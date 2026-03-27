import { Router } from "express";

import authRoutes from "./authRoutes.js";
import adminRoutes from "./adminRoutes.js";
import questionRoutes from "./questionRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/questions", questionRoutes);

export default router;
