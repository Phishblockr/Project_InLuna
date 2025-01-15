import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import winston from 'winston';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { decrypt, encrypt } from '../utils/tokenEncryption.js';

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
    const { orgId, username, password, rememberMe } = req.body;

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    console.log(req.body);

    if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }

    try {
        const user = await User.findOne({ orgId, username });

        console.log(user);

        if (!user) {
            return res.status(404).json({ error: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (username === user.username && isMatch) {
            const payload = {
                userId: user.id,
                orgId: user.orgId,
                userType: user.userType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
            const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: 'HS256', expiresIn: rememberMe ? "7d" : "1d" })

            const encryptedRefreshToken = await encrypt(refreshToken);
            user.refreshToken = encryptedRefreshToken;
            await user.save();

            res.cookie('refreshToken', encryptedRefreshToken, cookieOptions);

            if (user.userType === process.env.ADMIN) {
                console.log("Admin Logged in");
                res.status(200).json({ token, redirectUrl: process.env.FRONT_END_URL });
            } else if (user.userType === process.env.USER) {
                console.log("User Logged in");
                res.status(200).json({ token, redirectUrl: process.env.TRAINING_FRONTEND_URL });
            } else {
                res.status(403).json({ error: 'Unauthorized role' });
            }
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login on Super Dashboard (only super admin)
export const loginSuperAdm = asyncHandler(async (req, res) => {
    const {username, password, rememberMe} = req.body;

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    }
    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (username === user.username && isMatch && user.userType === process.env.SUPERADM) {
            const payload = {
                userId: user.id,
                userType: user.userType
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
            const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: 'HS256', expiresIn: rememberMe ? "7d" : "1d" })

            const encryptedRefreshToken = await encrypt(refreshToken);
            user.refreshToken = encryptedRefreshToken;
            await user.save();

            res.cookie('refreshToken', encryptedRefreshToken, cookieOptions);
            res.status(200).json({ token });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
})

export const refreshTokenDas = async (req, res) => {
    try {
        const { refreshToken: encryptedRefreshToken } = req.cookies;

        if (!encryptedRefreshToken) {
            console.warn("No refresh token provided in the request.");
            return res.status(400).json({ message: "Refresh token is required" });
        }

        let refreshToken;
        try {
            refreshToken = decrypt(encryptedRefreshToken);
        } catch (error) {
            console.error("Error decrypting refresh token:", error);
            return res.status(400).json({ message: "Invalid refresh token format" });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
        } catch (error) {
            console.error("Error verifying refresh token:", error);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Refresh token expired" });
            }
            return res.status(400).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const decryptedStoredToken = decrypt(user.refreshToken);
        if (decryptedStoredToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }
        let newPayload
        if (user.userType === process.env.SUPERADM){
            newPayload = {
                userId: user.id,
                userType: user.userType,
            };
        }
        else{
            newPayload = {
                userId: user.id,
                orgId: user.orgId,
                userType: user.userType,
            };
        }

        const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
        });

        const newRefreshToken = jwt.sign(newPayload, process.env.JWT_SECRET_REFRESH, {
            algorithm: "HS256",
            expiresIn: "7d",
        });

        const encryptedNewRefreshToken = await encrypt(newRefreshToken);
        user.refreshToken = encryptedNewRefreshToken;
        await user.save();

        res.cookie("refreshToken", encryptedNewRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({ token: newToken });
    } catch (error) {
        console.error("Error in refreshTokenDas:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkAuthDas = async (req, res) => {
    try {
        // Extract the encrypted refresh token from cookies
        const { refreshToken: encryptedRefreshToken } = req.cookies;

        if (!encryptedRefreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        // Decrypt the refresh token
        const refreshToken = decrypt(encryptedRefreshToken);

        // Verify the refresh token
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);

        // Generate a new access token using the payload's user data (excluding iat/exp)
        const { iat, exp, ...userData } = payload;
        const newToken = jwt.sign(userData, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
        });

        // Respond with the new access token
        res.status(200).json({ token: newToken });

    } catch (error) {
        console.error("Error in checkAuthDas:", error);
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};


export const logoutDas = async (req, res) => {
    try {
        // const { refreshToken } = req.body;
        const { refreshToken: encryptedRefreshToken } = req.cookies;

        // if (!refreshToken) {
        //     return res.status(400).json({ message: "Refresh token is required" });
        // }

        if (encryptedRefreshToken) {
            const refreshToken = decrypt(encryptedRefreshToken);
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
            const user = await User.findById(payload.userId);
            if (!user) {
                return res.status(400).json({ message: "Invalid user" });
            }
            user.refreshToken = null;
            await user.save();
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};