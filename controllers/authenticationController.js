import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import winston from 'winston';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ]
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
    const { orgId, username, password } = req.body;
    try {
        const user = await User.findOne({ orgId, username });

        if (!user) {
            return res.status(404).json({ error: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (username === user.username && isMatch) {
            const payload = {
                userId: user.id,
                orgId: user.orgId,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
            const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: 'HS256', expiresIn: '30d' });
            user.refreshTokenExt = refreshToken;
            await user.save();
            res.status(200).json({ token, refreshToken });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export const refreshTokenExt = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token require" })
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshTokenExt !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }
        const payload = { userId: user.id, orgId: user.orgId };
        const newToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
        const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: 'HS256', expiresIn: '30d' });

        user.refreshTokenExt = newRefreshToken;
        await user.save();

        res.json({
            token: newToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Login admin (dashboard)
export const loginAdmin = asyncHandler(async (req, res) => {
    const { orgId, username, password } = req.body;
    try {
        const user = await User.findOne({ orgId, username });

        if (!user) {
            return res.status(404).json({ error: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (username === user.username && isMatch && user.userType === process.env.ADMIN) {
            const payload = {
                userId: user.id,
                orgId: user.orgId,
                userType: user.userType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
            const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })

            user.refreshToken = refreshToken;
            await user.save();

            res.status(200).json({ token, refreshToken });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export const refreshTokenDas = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }

        jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }

            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                return res.status(403).json({ message: "Invalid refresh token" })
            }

            const payload = {
                userId: user.id,
                orgId: user.orgId,
                userType: user.userType
            }

            const newToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
            const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' })

            user.refreshToken = newRefreshToken;
            await user.save();


            res.json({
                token: newToken,
                refreshToken: newRefreshToken,
            });
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logoutDas = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }

        // Find the user with the given refresh token and invalidate it
        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(400).json({ message: "Invalid refresh token" });
        }

        // Remove the refresh token from the database
        user.refreshToken = null; // Invalidate the refresh token
        await user.save();

        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};