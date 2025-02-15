import sgMail from "@sendgrid/mail";
import UserSchema from "../models/userModel.js"
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AdminLogsSchema from "../models/adminlogsModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { getTenantModel } from "../admindb.js";
import { getTenantDB } from "../tenantdb.js";
import mongoose from "mongoose";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateUsernameReminder = (user, userId, orgId, reqMadeFrom) => {
    return `<p>Your username is: <strong>${user.username}</strong></p>`;
};

const generateOrgIdReminder = (user, userId, orgId, reqMadeFrom) => {
    return `<p>Your organization id is: <strong>${user.orgId}</strong></p>`;
}

const generatePasswordResetLink = async (user, userId, orgId, reqMadeFrom) => {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONT_END_URL}/resetPassword/${resetToken}`;
    return `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
};

const sendEmail = async (to, subject, content, user) => {
    const msg = {
        to,
        from: process.env.VERIFIED_SENDER_EMAIL,
        subject,
        html: `
        <body>
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;  font-size: 18px; color: #333; background-color: #eeeeee;">
    <header style="padding: 26px; background-color: #0364BD; color: #f4f4f4; font-size: 24px; display: flex; align-items: center; gap: 26px; border-radius: 0px 0px 10px 10px; box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="47.5 47.5 105 105">
            <circle cx="100" cy="100" r="50" fill="white" stroke="red" stroke-width="5"></circle>
            <circle cx="100" cy="100" r="25" fill="black"></circle>
        </svg>
        <span style="font-weight: bold;">InLuna - Support</span>
    </header>
    <div style="padding: 10px; width: 100%;">
        <p>Hi ${user.name}</p>
        <p>We received your request for account assistance. Here are the details:</p>
        <span>${content}</span>
        <p>If you did not made this request, it's possible someone else is trying to access your InLuna account. <br> <strong>Please ignore this email if you did not request assistance.</strong></p>
        <p>Sincerely yours,</p>
        <p>The InLuna team</p>
    </div>
    <footer style="padding: 20px; font-size: 14px; color: #777; text-align: center; background-color: #0364BD; color: #f4f4f4; border-radius: 10px 10px 0px 0px;">
        <p>If you need further assistance, please contact our support team at 
            <a href="mailto:support@excellitude.com" style="color: #f4f4f4; text-decoration: none;">support@InLuna.com</a>.
        </p>
        <p style="margin-top: 10px;">Excellitude Pvt ltd. | 1234 Cybersecurity Lane, Suite 100 | Security City, SC 12345</p>
        <p style="margin-top: 10px;">
            <a href="https://InLuna.com/privacy-policy" style="color: #f4f4f4; text-decoration: none;">Privacy Policy</a> | 
            <a href="https://InLuna.com/terms-of-service" style="color: #f4f4f4; text-decoration: none;">Terms of Service</a>
        </p>
    </footer>
    </div>
    
    <style>
        /* Ensures mobile style on both desktop and mobile */
        @media screen and (max-width: 600px) {
            div[style*="max-width: 600px;"] {
                padding: 20px;
                font-size: 16px;
                text-align: center;
            }
        }
    </style>
        `,
    };
    await sgMail.send(msg);
};


export const handleForgotDetails = asyncHandler(async (req, res) => {
    const { email, orgId, isPasswordReset, isUsernameReminder, reqMadeFrom } = req.body;

    if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required." });
    }

    if (!isPasswordReset && !isUsernameReminder) {
        return res.status(400).json({ message: "Invalid request option. Select at least one." });
    }

    try {
        // ✅ Get the tenant-specific database
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to connect to tenant database." });
        }

        // ✅ Get the correct User model for the tenant
        if (!tenantDb.models.User) {
            tenantDb.model("User", UserSchema);
        }
        const User = tenantDb.models.User;

        // ✅ Fetch user from tenant database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found in the provided organization." });
        }

        const userId = user._id;
        let emailContent = '';
        let responseMessage = [];

        // ✅ Generate username reminder if requested
        if (isUsernameReminder) {
            emailContent += generateUsernameReminder(user, userId, orgId, reqMadeFrom);
            responseMessage.push(`Requested Username reminder.`);
        }

        // ✅ Generate password reset link if requested
        if (isPasswordReset) {
            emailContent += await generatePasswordResetLink(user, userId, orgId, reqMadeFrom);
            responseMessage.push(`Requested Password reset link.`);
        }

        // ✅ Send email
        await sendEmail(email, "InLuna Dashboard - Forgot Details Assistance", emailContent, user);

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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long and contain both letters and numbers."
        });
    }

    try {
        // ✅ Get the tenant-specific database
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to connect to tenant database." });
        }

        // ✅ Get the correct User model for this tenant
        if (!tenantDb.models.User) {
            tenantDb.model("User", UserSchema);
        }
        const User = tenantDb.models.User;

        // ✅ Find the user in this tenant DB
        const user = await User.findOne({ resetPasswordExpires: { $gt: Date.now() } });

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
