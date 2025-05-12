import UserSchema from "../models/userModel.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AdminLogsSchema from "../models/adminlogsModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { getTenantModel } from "../admindb.js";
import { getTenantDB } from "../tenantdb.js";
import mongoose from "mongoose";
import { sendForgotDetailsMail } from "../utils/sendForgotDetailsMail.js";

const generateUsernameReminder = (user, userId, orgId, reqMadeFrom) => {
  return `<p>Your username is: <strong>${user.username}</strong></p>`;
};

const generateOrgIdReminder = (user, userId, orgId, reqMadeFrom) => {
  return `<p>Your organization id is: <strong>${user.orgId}</strong></p>`;
};

const generatePasswordResetLink = async (user, userId, orgId, reqMadeFrom) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(resetToken, 10);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `${process.env.FRONT_END_URL}/resetPassword/${resetToken}`;
  return `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
};

export const handleForgotDetails = asyncHandler(async (req, res) => {
  const { email, orgId, isPasswordReset, isUsernameReminder, reqMadeFrom } =
    req.body;

  if (!orgId) {
    return res.status(400).json({ message: "Organization ID is required." });
  }

  if (!isPasswordReset && !isUsernameReminder) {
    return res
      .status(400)
      .json({ message: "Invalid request option. Select at least one." });
  }

  try {
    // ✅ Get the tenant-specific database
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to connect to tenant database." });
    }

    // ✅ Get the correct User model for the tenant
    if (!tenantDb.models.User) {
      tenantDb.model("User", UserSchema);
    }
    const User = tenantDb.models.User;

    // ✅ Fetch user from tenant database
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found in the provided organization." });
    }

    const userId = user._id;
    let emailContent = "";
    let responseMessage = [];

    // ✅ Generate username reminder if requested
    if (isUsernameReminder) {
      emailContent += generateUsernameReminder(
        user,
        userId,
        orgId,
        reqMadeFrom,
      );
      responseMessage.push(`Requested Username reminder.`);
    }

    // ✅ Generate password reset link if requested
    if (isPasswordReset) {
      emailContent += await generatePasswordResetLink(
        user,
        userId,
        orgId,
        reqMadeFrom,
      );
      responseMessage.push(`Requested Password reset link.`);
    }

    // ✅ Send email
    await sendForgotDetailsMail(
      email,
      `InLuna ${reqMadeFrom} Support - Forgot Details Assistance`,
      emailContent,
      user,
    );

    // ✅ Log only for admin users
    if (user.userType === process.env.ADMIN) {
      // ✅ Get AdminLogs model for the tenant
      if (!tenantDb.models.AdminLogs) {
        tenantDb.model("AdminLogs", new mongoose.Schema(AdminLogsSchema));
      }
      const AdminLogs = tenantDb.models.AdminLogs;

      // ✅ Add Log entry in tenant DB
      await AdminLogs.create({
        userId,
        operationType: "account recovery",
        operationsPerformed: `${responseMessage.join(" ")} for ${reqMadeFrom}`,
        orgId,
      });
    }

    res.status(200).json({ message: responseMessage.join(" ") });
  } catch (error) {
    console.error("❌ Error in handleForgotDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { orgId, newPassword, confirmPassword } = req.body; // ✅ Take orgId from user input

  if (!orgId) {
    return res.status(400).json({ message: "Organization ID is required." });
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long and contain both letters and numbers.",
    });
  }

  try {
    // ✅ Get the tenant-specific database
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to connect to tenant database." });
    }

    // ✅ Get the correct User model for this tenant
    if (!tenantDb.models.User) {
      tenantDb.model("User", UserSchema);
    }
    const User = tenantDb.models.User;

    // ✅ Find the user in this tenant DB
    const user = await User.findOne({
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user || !(await bcrypt.compare(token, user.resetPasswordToken))) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = user._id;

    // ✅ Hash new password and update user
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // ✅ Store logs in the correct tenant DB
    if (!tenantDb.models.AdminLogs) {
      tenantDb.model("AdminLogs", new mongoose.Schema(AdminLogsSchema));
    }
    const AdminLogs = tenantDb.models.AdminLogs;

    await AdminLogs.create({
      userId,
      operationType: "account recovery",
      operationsPerformed: "Password reset successful",
      orgId,
    });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});
