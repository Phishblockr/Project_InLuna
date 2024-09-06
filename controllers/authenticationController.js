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
            res.status(200).json({ token });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
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
            res.status(200).json({ token });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Server error' });
    }
});