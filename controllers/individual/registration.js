import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualModels/individualUserModel.js";
import { generateUsername } from "../../utils/generateUsername.js";
import bcrypt from "bcryptjs";
import { sendOnboardingIndividualUsrEmail } from "../../utils/sendOnboardingIndividualUsrEmail.js";
import { isDisposableEmail } from "../../utils/isDisposableEmail.js";
import { verifyRecaptchaToken } from "../../utils/recaptcha.js";

export const createindividualUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, recaptchaToken } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }

  // reCAPTCHA verification (Enterprise)
  if (process.env.RECAPTCHA_ENABLED === "true") {
    const verification = await verifyRecaptchaToken({
      token: recaptchaToken,
      expectedAction: "individual_signup",
    });
    if (!verification.valid) {
      return res.status(400).json({
        message: "reCAPTCHA verification failed",
        reasons: verification.reasons,
        error: verification.error,
      });
    }
    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    if (verification.score !== null && verification.score < minScore) {
      return res.status(403).json({
        message: "Suspicious activity detected (low reCAPTCHA score)",
        score: verification.score,
      });
    }
  }

  // Block disposable / temporary email domains
  if (isDisposableEmail(email)) {
    return res.status(400).json({
      message:
        "Disposable / temporary email addresses are not allowed. Please use a valid permanent email.",
    });
  }

  const User = await getIndividualUserModel();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User with this email already exists." });
  }

  const username = generateUsername(email);

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long and contain both letters and numbers.",
    });
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    name,
    email,
    role,
    password: hashedPassword,
    userType: process.env.INDIVIDUAL,
    subscription: "freemium",
  });

  const addedUser = await newUser.save();

  sendOnboardingIndividualUsrEmail(
    addedUser.email,
    "Welcom to Inluna 🙏🏻",
    addedUser
  );

  res
    .status(201)
    .json({ message: "Individual user created successfully", user: addedUser });
});
