import User from '../models/userModel.js';
import HeartBeat from '../models/heartBeatModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import bcrypt from 'bcryptjs';
import winston from 'winston';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateUsername } from '../utils/generateUsername.js';
import dotenv from 'dotenv';
import sgMail from "@sendgrid/mail";
import crypto from "crypto";

// for adminLog
import AdminLogs from "../models/adminlogsModel.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";

    const id = req.user.orgId;

    const searchFilter = search ? {
        $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } }
        ]
    } : {};

    const statusFilter = status === "all" ? {} : {
        status: { $regex: `^${status}$`, $options: "i" }
    };

    const queryFilter = { orgId: id, ...searchFilter, ...statusFilter };

    const users = await User.find(queryFilter).select('-password').skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(queryFilter);

    if (users.length === 0) {
        return res.status(400).json({ error: "Users not found" });
    }

    const userIds = users.map((user) => user._id);
    const heartBeats = await HeartBeat.find({userId: {$in: userIds}});

    const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
    const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD)

    const usersWithHeartBeatStatus = users.map((user) => {
        const heartBeat = heartBeats.find((hb) => hb.userId.toString() === user._id.toString());

        let heartBeatStatus = "not initialized";
        if (heartBeat){
            const isInactive = heartBeat.timestamp < cutoffDate;
            const hasDownTimeToday = heartBeat.downtime.some((dt) => {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);
                return dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday;
            });

            if (hasDownTimeToday) {
                heartBeatStatus = "downtime detected";
            } else if (isInactive) {
                heartBeatStatus = "inactive";
            } else {
                heartBeatStatus = "active"
            }
        }
        return {
            ...user.toObject(),
            heartBeatStatus,
        };
    });
    res.status(200).json({
        users: usersWithHeartBeatStatus,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
    });
});

//send setup password mail
const generatePasswordSetupLink = async (user)=>{
    const setPassToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(setPassToken,10);

    user.setupPasswordToken = hashedToken;
    user.setupPasswordExpires = Date.now() + 86400000 ; // 24hour
    await user.save();

    const setPasswordLink = `${process.env.FRONT_END_URL}/setupPassword/${setPassToken}`;

    return `<p>Click <a href="${setPasswordLink}">here</a> to reset your password.</p>`;
}

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

export const setupPassword = async (req, res) => {
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
            setupPasswordExpires: { $gt: Date.now() },
        });

        if (!user || !(await bcrypt.compare(token, user.setupPasswordToken))) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = user._id;
        const orgId = user.orgId;

        user.password = await bcrypt.hash(newPassword, 10);
        user.setupPasswordToken = undefined;
        user.setupPasswordExpires = undefined;

        await user.save();

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "password setup",
            operationsPerformed: `Password setup successful`,
            orgId,
        })

        res.status(200).json({ message: 'Password set successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error setting password' });
        console.log(error);
    }
}


// Create a new user
export const createUser = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const { name, email, phone, role, department, gender, userType, img, status } = req.body;

        let UserTypeCode

        if (userType === "admin") {
            UserTypeCode = process.env.ADMIN;
        } else {
            UserTypeCode = process.env.USER;
        }

        const username = generateUsername(email, phone);
        const newUser = new User({
            username,
            name,
            status,
            gender,
            email,
            phone,
            role,
            department,
            img,
            orgId,
            userType: UserTypeCode
        });
        const addedUser = await newUser.save();
        let emailContent = '';
        emailContent += await generatePasswordSetupLink(addedUser);
        await sendEmail(email, "InLuna Dashboard - Password Setup", emailContent, addedUser);
        const io = req.app.get("socketio");
        io.emit("userCreated", addedUser);

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "add",
            operationsPerformed: `User created: ${name} with userType ${UserTypeCode}`,
            orgId,
            entityId: addedUser._id,
            entityType: "user"
        })

        res.status(201).json(addedUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a new admin
export const createAdmin = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, phone, role, department, img, orgId } = req.body;

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const username = generateUsername(email, phone);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const UserTypeCode = process.env.ADMIN;

        const newUser = new User({
            username,
            name,
            email,
            password: hashedPassword,
            phone,
            role,
            department,
            img,
            orgId,
            userType: UserTypeCode,
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
});


// Get a single user by ID
export const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    res.status(user ? 200 : 404).json(user ? user : { error: 'User not found' });
});

// Update a user
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userId = req.user.userId;
    const orgId = req.user.orgId;

    const { username, name, email, phone, role, department } = req.body;
    const updates = {
        username,
        name,
        email,
        phone,
        role,
        department,
    };
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    }).select('-password');
    if (updatedUser) {
        const io = req.app.get('socketio');
        io.emit('userUpdated', updatedUser);

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "update",
            operationsPerformed: `User updated: ${name} with userType ${UserTypeCode}`,
            orgId,
            entityId: id,
            entityType: "user"
        })

        res.status(200).json(updatedUser);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Update User Status
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userId = req.user.userId;
    const orgId = req.user.orgId;

    const user = await User.findById(id).select("-password");
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.status = user.status === "active" ? "inactive" : "active";
    const updatedUser = await user.save();

    const io = req.app.get("socketio");
    io.emit("userStatusUpdated", updatedUser);

    // Add Log entry
    await AdminLogs.create({
        userId,
        operationType: "update",
        operationsPerformed: `User status updated: ${updatedUser.email} to ${updatedUser.status}`,
        orgId,
        entityId: id,
        entityType: "user"
    })

    res.status(200).json(updatedUser);
})
// update admin
export const updateAdminDetails = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, email, recoveryEmail, phone, role, department, img } = req.body;
        const updateUser = await User.findByIdAndUpdate(
            userId,
            { name, email, recoveryEmail, phone, role, department, img },
            { new: true, runValidators: true }
        );
        if (!updateUser) {
            return res.status(404).json({ message: "User not found" })
        }
        res.json(updateUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }

})

// Update admin password
export const updateAdminPwd = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save()

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "update",
            operationsPerformed: `Admin pwd updated: ${user.name}`,
            orgId,
            entityId: userId,
            entityType: "user"
        })

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
})

// verify admin pwd
export const verifyAdminPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password" });
    }

    res.status(200).json({ message: "Password verified" });
});

// Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId;
    const orgId = req.user.orgId;

    const user = await User.findById(id).select('-password');
    if (user) {
        const userId = user._id.toString()
        if (userId === adminId) {
            res.status(403).json({ error: "You cannot delete your own account" })
        } else {
            await User.findByIdAndDelete(id);
            const io = req.app.get('socketio');
            io.emit('userDeleted', user._id);

            // Add Log entry
            await AdminLogs.create({
                userId: adminId,
                operationType: "delete",
                operationsPerformed: `user deleted Name: ${user.email}`,
                orgId,
                entityId: id,
                entityType: "user",
                entityDetails: { identifier: user.email, status: user.status, extraInfo: `Department: ${user.department}` }
            })

            res.status(200).json({ message: `User ${user.email} removed successfully` });
        }
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

export const addUsersFromCsv = asyncHandler(async (req, res) => {

    const filePath = req.file.path;
    const users = [];
    const errors = [];
    const userId = req.user.userId;
    const orgId = req.user.orgId;

    try {
        const existingEmails = new Set(await User.find({ orgId }).distinct("email"))
        const existingPhones = new Set(await User.find({ orgId }).distinct("phone"))

        const processedEmails = new Set();
        const processedPhones = new Set();

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    const { Name, Email, Phone, Gender, Role, Department } = row;
                    const email = Email.toLowerCase();
                    const phone = Phone;

                    if (processedEmails.has(email)) {
                        errors.push({ row: row, error: `Duplicate email in CSV: ${email}` });
                        return;
                    }

                    if (processedPhones.has(phone)) {
                        errors.push({ row: row, error: `Duplicate phone in CSV: ${phone}` });
                        return;
                    }

                    if (existingEmails.has(email)) {
                        errors.push({ row: row, error: `Email already exists in DB: ${email}` });
                        return;
                    }

                    if (existingPhones.has(phone)) {
                        errors.push({ row: row, error: `Phone number already exists in DB: ${phone}` });
                        return;
                    }

                    const name = Name;
                    const gender = Gender.toLowerCase();
                    const role = Role.toLowerCase();
                    const department = Department.toLowerCase();

                    const username = generateUsername(email, phone);
                    users.push({ name, email, phone, gender, role, department, username, orgId });

                    processedEmails.add(email);
                    processedPhones.add(phone);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (errors.length > 0) {
            res.status(400).json({
                message: 'CSV contains errors',
                errors: errors,
            });
            return;
        }

        if (users.length > 0) {
            const insertedUsers = await User.insertMany(users);
            const io = req.app.get('socketio');
            io.emit("usersByCsvAdded", insertedUsers);

            for(let i=0;i<insertedUsers.length;i++){
                const user = insertedUsers[i];
                let emailContent = '';
                emailContent += await generatePasswordSetupLink(user);
                await sendEmail(user.email, "InLuna Dashboard - Password Setup", emailContent, user);
            }

            // Add Log entry
            await AdminLogs.create({
                userId,
                operationType: "add",
                operationsPerformed: `users added via CSV`,
                orgId,
            })

            res.status(200).json({ message: 'Users added successfully' });
        } else {
            res.status(400).json({ message: 'No valid data to add' });
        }

    } catch (error) {
        console.error('Error adding users from CSV:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

export const fetchProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select("img name username email recoveryEmail phone role department status")
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    };
};


