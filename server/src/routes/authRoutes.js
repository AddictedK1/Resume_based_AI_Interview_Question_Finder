import { Router } from "express";

import {
  adminPing,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import { ROLES } from "../constants/roles.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/authSchemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authRouter = Router();

authRouter.post("/register", authLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post("/verify-email", authLimiter, validate(verifyEmailSchema), asyncHandler(verifyEmail));
authRouter.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(resendVerification),
);
authRouter.post("/login", authLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post("/refresh", asyncHandler(refresh));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
authRouter.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(resetPassword),
);
authRouter.get("/me", authenticate, asyncHandler(me));
authRouter.get(
  "/admin/ping",
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(adminPing),
);

export default authRouter;
