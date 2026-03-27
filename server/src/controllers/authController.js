import { env } from "../config/env.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../models/User.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import { ApiError } from "../utils/apiError.js";
import { generateToken, hashToken } from "../utils/crypto.js";
import { signAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const buildSafeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

export const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email already in use");
  }

  const token = generateToken();
  const emailVerificationTokenHash = hashToken(token);
  const emailVerificationTokenExpiresAt = new Date(
    Date.now() + env.EMAIL_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );

  const role =
    env.DEFAULT_ADMIN_EMAIL && email.toLowerCase() === env.DEFAULT_ADMIN_EMAIL.toLowerCase()
      ? ROLES.ADMIN
      : ROLES.USER;

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role,
    emailVerificationTokenHash,
    emailVerificationTokenExpiresAt,
  });

  let message = "Registration successful. Please verify your email.";

  try {
    await sendVerificationEmail({ to: user.email, token });
  } catch (error) {
    console.error("Verification email send failed:", error.message);
    message =
      "Registration successful, but we could not send the verification email right now. Please use resend verification.";
  }

  return res.status(201).json({ message });
};

export const verifyEmail = async (req, res) => {
  const { email, token } = req.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(400, "Invalid verification request");
  }

  const isTokenValid =
    user.emailVerificationTokenHash === tokenHash &&
    user.emailVerificationTokenExpiresAt &&
    user.emailVerificationTokenExpiresAt > new Date();

  if (!isTokenValid) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationTokenExpiresAt = null;
  await user.save();

  return res.status(200).json({ message: "Email verified successfully" });
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(200).json({ message: "If the account exists, a verification email was sent" });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({ message: "Email is already verified" });
  }

  const token = generateToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationTokenExpiresAt = new Date(
    Date.now() + env.EMAIL_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );
  await user.save();

  try {
    await sendVerificationEmail({ to: user.email, token });
  } catch (error) {
    console.error("Resend verification email failed:", error.message);
    return res.status(200).json({
      message:
        "We could not send the verification email right now. Please try again in a moment.",
    });
  }

  return res.status(200).json({ message: "Verification email sent" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
  });

  return res.status(200).json({
    message: "Login successful",
    accessToken,
    user: buildSafeUser(user),
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res
      .status(200)
      .json({ message: "If the account exists, password reset instructions were sent" });
  }

  const token = generateToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetTokenExpiresAt = new Date(
    Date.now() + env.RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );
  await user.save();

  try {
    await sendPasswordResetEmail({ to: user.email, token });
  } catch (error) {
    console.error("Password reset email send failed:", error.message);
  }

  return res
    .status(200)
    .json({ message: "If the account exists, password reset instructions were sent" });
};

export const resetPassword = async (req, res) => {
  const { email, token, password } = req.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(400, "Invalid password reset request");
  }

  const isResetTokenValid =
    user.passwordResetTokenHash === tokenHash &&
    user.passwordResetTokenExpiresAt &&
    user.passwordResetTokenExpiresAt > new Date();

  if (!isResetTokenValid) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  await user.save();

  return res.status(200).json({ message: "Password reset successful" });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user.sub);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json({ user: buildSafeUser(user) });
};

export const adminPing = async (_req, res) => {
  return res.status(200).json({ message: "Admin access confirmed" });
};
