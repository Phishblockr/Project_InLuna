import sgMail from "@sendgrid/mail";
import User from "../models/userModel.js"
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AdminLogs from "../models/adminlogsModel.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateUsernameReminder = async (user, userId, orgId) => {
    // Add Log entry
    await AdminLogs.create({
        userId,
        operationType: "account recovery",
        operationsPerformed: `Requested Username Reminder E-mail`,
        orgId,
    })
    return `<p>Your username is: <strong>${user.username}</strong></p>`;
};

const generatePasswordResetLink = async (user, userId, orgId) => {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONT_END_URL}/resetPassword/${resetToken}`;

    // Add Log entry
    await AdminLogs.create({
        userId,
        operationType: "account recovery",
        operationsPerformed: `Requested Password Reset E-mail`,
        orgId,
    })

    return `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
};

const sendEmail = async (to, subject, content) => {
    const msg = {
        to,
        from: process.env.VERIFIED_SENDER_EMAIL,
        subject,
        html: `${content}<br/><p>Thank you,</p><p>Team Phishblockr</p>`,
    };
    await sgMail.send(msg);
};


export const handleForgotDetails = async (req, res) => {
    const { email, isPasswordReset, isUsernameReminder } = req.body;

    if (!isPasswordReset && !isUsernameReminder) {
        return res.status(404).json({ message: "Invalid option" });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }
        const userId = user._id;
        const orgId = user.orgId;

        let emailContent = '';
        let responseMessage = [];

        // Generate username reminder if requested
        if (isUsernameReminder) {
            emailContent += await generateUsernameReminder(user, userId, orgId);
            responseMessage.push("Username reminder sent.");
        }

        // Generate password reset link if requested
        if (isPasswordReset) {
            emailContent += await generatePasswordResetLink(user, userId, orgId);
            responseMessage.push("Password reset link sent.");
        }

        // Send the combined email
        await sendEmail(email, "Phishblockr Dashboard - Forgot Details Assistance", emailContent);

        res.status(200).json({ message: responseMessage.join(" ") });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
    }

    try {
        const user = await User.findOne({
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user || !(await bcrypt.compare(token, user.resetPasswordToken))) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = user._id;
        const orgId = user.orgId;

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "account recovery",
            operationsPerformed: `Password reset successful`,
            orgId,
        })

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
}