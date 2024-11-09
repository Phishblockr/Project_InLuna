import sgMail from "@sendgrid/mail";
import User from "../models/userModel.js"
import crypto from "crypto";
import bcrypt from "bcryptjs";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const verified_sender_mail = process.env.VERIFIED_SENDER_EMAIL;

export const sendUsernameReminder = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }
        const msg = {
            to: email,
            from: verified_sender_mail,
            subject: 'Phishblockr Dashboard - Your Username Reminder',
            html: `<p>Your username is: <strong>${user.username}</strong></p><br><p>Thank you,</p><br><p>Team Phishblockr</p>`,
        };
        await sgMail.send(msg);
        res.status(200).json({ message: `Username reminder sent successfully to ${email}` });
    } catch (error) {
        res.status(500).json({ message: error });
    }
}


export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(resetToken, 10)
        // Store hashed token in DB
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpiries = Date.now() + 3600000; //1 hr

        await user.save();

        const resetLink = `http://localhost:5000/api/resetPassword/${resetToken}`;

        const msg = {
            to: email,
            from: verified_sender_mail,
            subject: "Phishblockr Dashboard - Password Reset",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p><br><p>Thank you,</p><br><p>Team Phishblockr</p>`,
        }
        await sgMail.send(msg);

        res.status(200).json({ message: "Password reset link sent to email" });
    } catch (error) {
        res.status(500).json({ message: "Error sending password reset email" });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user || !(await bcrypt.compare(token, user.resetPasswordToken))) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
}