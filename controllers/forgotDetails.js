import sgMail from "@sendgrid/mail";
import User from "../models/userModel.js"
import crypto from "crypto";
import bcrypt from "bcryptjs";

import AdminLogs from "../models/adminlogsModel.js";

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
        <span style="font-weight: bold;">Phishblockr - Support</span>
    </header>
    <div style="padding: 10px; width: 100%;">
        <p>Hi ${user.name}</p>
        <p>We received your request for account assistance. Here are the details:</p>
        <span>${content}</span>
        <p>If you did not made this request, it's possible someone else is trying to access your Phishblockr account. <br> <strong>Please ignore this email if you did not request assistance.</strong></p>
        <p>Sincerely yours,</p>
        <p>The Phishblockr team</p>
    </div>
    <footer style="padding: 20px; font-size: 14px; color: #777; text-align: center; background-color: #0364BD; color: #f4f4f4; border-radius: 10px 10px 0px 0px;">
        <p>If you need further assistance, please contact our support team at 
            <a href="mailto:support@excellitude.com" style="color: #f4f4f4; text-decoration: none;">support@phishblockr.com</a>.
        </p>
        <p style="margin-top: 10px;">Excellitude Pvt ltd. | 1234 Cybersecurity Lane, Suite 100 | Security City, SC 12345</p>
        <p style="margin-top: 10px;">
            <a href="https://phishblockr.com/privacy-policy" style="color: #f4f4f4; text-decoration: none;">Privacy Policy</a> | 
            <a href="https://phishblockr.com/terms-of-service" style="color: #f4f4f4; text-decoration: none;">Terms of Service</a>
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


export const handleForgotDetails = async (req, res) => {
    const { email, isPasswordReset, isUsernameReminder, isOrgIdRem, reqMadeFrom } = req.body;

    if (!isPasswordReset && !isUsernameReminder && !isOrgIdRem) {
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
            emailContent += generateUsernameReminder(user, userId, orgId, reqMadeFrom);
            responseMessage.push(`Requested Username reminder.`);
        }

        // Generate password reset link if requested
        if (isPasswordReset) {
            emailContent += await generatePasswordResetLink(user, userId, orgId, reqMadeFrom);
            responseMessage.push(`Requested Password reset link.`);
        }

        if (isOrgIdRem) {
            emailContent += generateOrgIdReminder(user, userId, orgId, reqMadeFrom);
            responseMessage.push(`Requested Organization id reminder.`);
        }

        // Send the combined email
        await sendEmail(email, "Phishblockr Dashboard - Forgot Details Assistance", emailContent, user);

        if (user.userType === process.env.ADMIN) {
            // Add Log entry
            await AdminLogs.create({
                userId,
                operationType: "account recovery",
                operationsPerformed: `${responseMessage.join(" ")} for ${reqMadeFrom}`,
                orgId,
            })
        }

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