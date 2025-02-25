import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import winston from 'winston';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { decrypt, encrypt } from '../utils/tokenEncryption.js';
import {getUserModel} from "../tenantdb.js"
import { getSuperAdminModel } from '../models/superAdminModel.js';

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

    if (!orgId || !username || !password) {
        return res.status(400).json({ error: "Organization ID, username, and password are required." });
    }

    try {
        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Find the user within the tenant database
        const user = await User.findOne({ orgId, username });

        if (!user) {
            return res.status(404).json({ error: "Invalid credentials." });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT tokens
        const payload = {
            userId: user.id,
            orgId: user.orgId,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: "HS256", expiresIn: "30d" });

        // Store refresh token in the database
        user.refreshTokenExt = refreshToken;
        await user.save();

        res.status(200).json({ token, refreshToken });

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Server error" });
    }
});

export const refreshTokenExt = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required." });
    }

    try {
        // Verify and decode the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);

        const { userId, orgId } = decoded; // Extract orgId from token payload

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Find the user within the tenant database
        const user = await User.findById(userId);

        if (!user || user.refreshTokenExt !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token." });
        }

        // Generate new JWT tokens
        const payload = { userId: user.id, orgId: user.orgId };
        const newToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
        const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, { algorithm: "HS256", expiresIn: "30d" });

        // Store new refresh token in the database
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

    if (!orgId || !username || !password) {
        return res.status(400).json({ error: "Organization ID, username, and password are required." });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    try {
        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Find the user within the tenant database
        const user = await User.findOne({ orgId, username });

        if (!user) {
            return res.status(404).json({ error: "Invalid credentials." });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT tokens
        const payload = {
            userId: user.id,
            orgId: user.orgId,
            userType: user.userType,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
            algorithm: "HS256",
            expiresIn: rememberMe ? "7d" : "1d",
        });

        // Encrypt and store the refresh token
        const encryptedRefreshToken = await encrypt(refreshToken);
        user.refreshToken = encryptedRefreshToken;
        await user.save();

        // Set refresh token as a secure cookie
        res.cookie("refreshToken", encryptedRefreshToken, cookieOptions);

        // Redirect based on user type
        console.log(user.userType, process.env.USER)
        if (user.userType === process.env.ADMIN) {
            res.status(200).json({ token, redirectUrl: process.env.FRONT_END_URL });
        } else if (user.userType === process.env.USER) {
            res.status(200).json({ token, redirectUrl: process.env.TRAINING_FRONTEND_URL });
        } else {
            res.status(403).json({ error: "Unauthorized role." });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Server error." });
    }
});

// Login on Super Dashboard (only super admin)
export const loginSuperAdm = asyncHandler(async (req, res) => {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    if (rememberMe) {
        cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    try {
        // Get the Super Admin model from admindb
        const SuperAdmin = await getSuperAdminModel();

        // Find the super admin in admindb
        const user = await SuperAdmin.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "Invalid credentials." });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // Generate JWT tokens
        const payload = {
            userId: user.id,
            userType: process.env.SUPERADM,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
            algorithm: "HS256",
            expiresIn: rememberMe ? "7d" : "1d",
        });

        // Encrypt and store refresh token
        const encryptedRefreshToken = await encrypt(refreshToken);
        user.refreshToken = encryptedRefreshToken;
        await user.save();

        // Set refresh token in a secure cookie
        res.cookie("refreshToken", encryptedRefreshToken, cookieOptions);

        res.status(200).json({ token, message: "Super Admin logged in successfully." });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Server error." });
    }
});


export const refreshTokenDas = asyncHandler(async (req, res) => {
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

        let user;
        if (payload.userType === process.env.SUPERADM) {
            // Super Admin Handling (Stored in `admindb`)
            const SuperAdmin = await getSuperAdminModel();
            user = await SuperAdmin.findById(payload.userId);
        } else {
            // Tenant User Handling (Stored in respective `tenant-<orgId>` DB)
            const User = await getUserModel(payload.orgId);
            user = await User.findById(payload.userId);
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify stored refresh token
        const decryptedStoredToken = decrypt(user.refreshToken);
        if (decryptedStoredToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Generate new JWT tokens
        const newPayload = {
            userId: user.id,
            userType: user.userType,
            ...(user.orgId ? { orgId: user.orgId } : {}), // Include orgId only for tenant users
        };

        const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
        });

        const newRefreshToken = jwt.sign(newPayload, process.env.JWT_SECRET_REFRESH, {
            algorithm: "HS256",
            expiresIn: "7d",
        });

        // Encrypt and store new refresh token
        const encryptedNewRefreshToken = await encrypt(newRefreshToken);
        user.refreshToken = encryptedNewRefreshToken;
        await user.save();

        // Set refresh token in a secure cookie
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
});

export const checkAuthDas = asyncHandler(async (req, res) => {
    try {
        // Extract the encrypted refresh token from cookies
        const { refreshToken: encryptedRefreshToken } = req.cookies;

        if (!encryptedRefreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        let refreshToken;
        try {
            refreshToken = decrypt(encryptedRefreshToken);
        } catch (error) {
            console.error("Error decrypting refresh token:", error);
            return res.status(400).json({ error: "Invalid refresh token format" });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
        } catch (error) {
            console.error("Error verifying refresh token:", error);
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }

        let user;
        if (payload.userType === process.env.SUPERADM) {
            // Super Admin Handling (Stored in `admindb`)
            const SuperAdmin = await getSuperAdminModel();
            user = await SuperAdmin.findById(payload.userId);
        } else {
            // Tenant User Handling (Stored in respective `tenant-<orgId>` DB)
            const User = await getUserModel(payload.orgId);
            user = await User.findById(payload.userId);
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Verify stored refresh token
        const decryptedStoredToken = decrypt(user.refreshToken);
        if (decryptedStoredToken !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
        }

        // Generate a new access token
        const { iat, exp, ...userData } = payload;
        const newToken = jwt.sign(userData, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
        });

        res.status(200).json({ token: newToken });

    } catch (error) {
        console.error("Error in checkAuthDas:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


export const logoutDas = asyncHandler(async (req, res) => {
    try {
        // Extract encrypted refresh token from cookies
        const { refreshToken: encryptedRefreshToken } = req.cookies;

        if (encryptedRefreshToken) {
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
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }

            let user;
            if (payload.userType === process.env.SUPERADM) {
                // Super Admin Handling (Stored in `admindb`)
                const SuperAdmin = await getSuperAdminModel();
                user = await SuperAdmin.findById(payload.userId);
            } else {
                // Tenant User Handling (Stored in respective `tenant-<orgId>` DB)
                const User = await getUserModel(payload.orgId);
                user = await User.findById(payload.userId);
            }

            if (!user) {
                return res.status(400).json({ message: "Invalid user" });
            }

            // Remove refresh token from user record
            user.refreshToken = null;
            await user.save();
        }

        // Clear refresh token cookie
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
});