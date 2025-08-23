import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualModels/individualUserModel.js";
import { generateUsername } from "../../utils/generateUsername.js";
import bcrypt from "bcryptjs";
import { sendOnboardingIndividualUsrEmail } from "../../utils/sendOnboardingIndividualUsrEmail.js";
import { isDisposableEmail } from "../../utils/isDisposableEmail.js";
import { verifyRecaptchaToken } from "../../utils/recaptcha.js";
import { getPendingIndividualModel } from "../../models/individualModels/pendingIndividualModel.js";
import crypto from "crypto";
import { sendIndividualVerificationEmail } from "../../utils/sendIndividualVerificationEmail.js";

// Step 1: initiate individual registration (store pending + send verification email)
export const initiateIndividualRegistration = asyncHandler(async (req, res) => {
  const { name, email, password, role, recaptchaToken } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (process.env.RECAPTCHA_ENABLED === "true") {
    const verification = await verifyRecaptchaToken({ token: recaptchaToken, expectedAction: "individual_signup" });
    if (!verification.valid) {
      return res.status(400).json({ message: "reCAPTCHA verification failed", reasons: verification.reasons, error: verification.error });
    }
    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    if (verification.score !== null && verification.score < minScore) {
      return res.status(403).json({ message: "Suspicious activity detected (low reCAPTCHA score)", score: verification.score });
    }
  }

  if (isDisposableEmail(email)) {
    return res.status(400).json({ message: "Disposable / temporary email addresses are not allowed." });
  }

  const User = await getIndividualUserModel();
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "User with this email already exists." });
  }

  const Pending = await getPendingIndividualModel();
  await Pending.deleteMany({ email });

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await Pending.create({ name, email, passwordHash, role, tokenHash, tokenExpiresAt });

  const frontendBase = process.env.FRONT_END_URL;
  const verifyLink = `${frontendBase}/verify-individual?token=${rawToken}&email=${encodeURIComponent(email)}`;
  try {
    await sendIndividualVerificationEmail(email, verifyLink, name);
  } catch (e) {
    return res.status(500).json({ message: "Failed to send verification email." });
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[TEST] Individual verification link:", verifyLink);
  }
  return res.status(202).json({ message: "Verification email sent. Please verify your email within 24 hours." });
});

// Step 2: verify individual email and create actual user
export const verifyIndividualEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res.status(400).json({ message: "token and email are required." });
  }
  const Pending = await getPendingIndividualModel();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const pending = await Pending.findOne({ email, tokenHash, tokenExpiresAt: { $gt: new Date() } });
  if (!pending) {
    return res.status(400).json({ message: "Invalid or expired verification token." });
  }
  const User = await getIndividualUserModel();
  const dup = await User.findOne({ email });
  if (dup) {
    await pending.deleteOne();
    return res.status(409).json({ message: "User already exists." });
  }
  const username = generateUsername(email);
  const newUser = new User({
    username,
    name: pending.name,
    email: pending.email,
    role: pending.role,
    password: pending.passwordHash,
    userType: process.env.INDIVIDUAL,
    subscription: "freemium",
  });
  const saved = await newUser.save();
  await pending.deleteOne();
  // send onboarding
  sendOnboardingIndividualUsrEmail(saved.email, "Welcome to InLuna 🙏🏻", saved);
  return res.status(201).json({ message: "Account verified and created.", user: { id: saved._id, username: saved.username, email: saved.email } });
});
