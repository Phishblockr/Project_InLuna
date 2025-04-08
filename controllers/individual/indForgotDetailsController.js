import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualModels/individualUserModel.js";
import { checkPasswordRequirements, friendlyMessages } from "../../utils/checkPasswordRequirements.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendForgotDetailsMail } from "../../utils/sendForgotDetailsMail.js";

const generateUsernameReminder = (user) => {
    return `<p>Your username is: <strong>${user.username}</strong></p>`;
};

const generatePasswordResetLink = async (user) => {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONT_END_URL}/resetPasswordInd/${resetToken}`;
    return `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;
};

export const handleForgotDetailsInd = asyncHandler(async (req, res) => {
    const { email, isPasswordReset, isUsernameReminder, reqMadeFrom } = req.body;

    if (!isPasswordReset && !isUsernameReminder) {
        return res.status(400).json({ message: "Invalid request option. Select at least one." });
    }

    try {
        const User = await getIndividualUserModel();
        if (!User) {
            return res.status(500).json({ message: "Failed to connect to individual database." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found in the db." });
        }

        const userId = user._id;
        let emailContent = '';
        let responseMessage = [];

        // Generate username reminder if requested
        if (isUsernameReminder) {
            emailContent += generateUsernameReminder(user);
            responseMessage.push(`Requested Username reminder.`);
        }

        // Generate password reset link if requested
        if (isPasswordReset) {
            emailContent += await generatePasswordResetLink(user);
            responseMessage.push(`Requested Password reset link.`);
        }

        // Send email
        await sendForgotDetailsMail(email, `InLuna ${reqMadeFrom} Support - Forgot Details Assistance`, emailContent, user);


        res.status(200).json({ message: responseMessage.join(" ") });
    } catch (error) {
        console.error("Error in handleForgotDetails:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export const resetPasswordInd = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long and contain both letters and numbers."
        });
    }

    try {
        const User = await getIndividualUserModel();

        const user = await User.findOne({ resetPasswordExpires: { $gt: Date.now() } });

        if (!user || !(await bcrypt.compare(token, user.resetPasswordToken))) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const passwordCheck = checkPasswordRequirements(newPassword, user.name, user.email);

        const failedChecks = Object.entries(passwordCheck)
        .filter(([__dirname, passed]) => !passed)
        .map(([key]) => key);

        if (failedChecks.length > 0) {
            const failedMessages = failedChecks.map(key => friendlyMessages[key]);
            return res.status(400).json({
                message: "Password does not meet requirements.",
                failedMessages,
            });
        }

        const userId = user._id;

        // Hash new password and update user
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("❌ Error resetting password:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
});
