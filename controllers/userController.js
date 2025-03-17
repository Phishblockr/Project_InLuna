import HeartBeatSchema from '../models/heartBeatModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import bcrypt from 'bcryptjs';
import winston from 'winston';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateUsername } from '../utils/generateUsername.js';
import dotenv from 'dotenv';
import sgMail from "@sendgrid/mail";
import UserSchema from '../models/userModel.js';
import { getUserModel, getTenantDB } from '../tenantdb.js';
import { getAdminLogsModel } from '../models/adminlogsModel.js';
import { sendPasswordSetupEmail } from '../utils/sendPasswordSetupEmail.js';
import { getOrgModel } from '../models/organisationModel.js';
import { generatePasswordSetupLink } from '../utils/generatePasswordSetupLink.js';

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
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const status = req.query.status || "all";

        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ error: "Tenant ID is required" });
        }

        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ error: "Failed to get tenant database" });
        }

        if (!tenantDb.models.User) tenantDb.model("User", UserSchema);
        if (!tenantDb.models.HeartBeat) tenantDb.model("HeartBeat", HeartBeatSchema);

        const User = tenantDb.models.User;
        const HeartBeat = tenantDb.models.HeartBeat;

        const searchFilter = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { role: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const statusFilter = status === "all" ? {} : { status: { $regex: `^${status}$`, $options: "i" } };

        const queryFilter = { orgId, ...searchFilter, ...statusFilter };

        const users = await User.find(queryFilter).select('-password').skip(skip).limit(limit);
        const totalUsers = await User.countDocuments(queryFilter);

        if (users.length === 0) {
            return res.status(404).json({ error: "Users not found" });
        }

        const userIds = users.map((user) => user._id);

        const heartBeats = await HeartBeat.find({ userId: { $in: userIds } });

        const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD);

        const usersWithHeartBeatStatus = users.map((user) => {
            const heartBeat = heartBeats.find((hb) => hb.userId.toString() === user._id.toString());

            let heartBeatStatus = "not initialized";
            if (heartBeat) {
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
                    heartBeatStatus = "active";
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

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Server error", message: error.message });
    }
});



// **Set Up Password for User**
export const setupPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword, orgId } = req.body;

    if (!orgId) {
        return res.status(400).json({ message: "Tenant ID is required." });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
    }

    try {
        const User = await getUserModel(orgId); // Get tenant-specific User model
        const tenantDb = await getTenantDB(orgId);
        const AdminLogs = await getAdminLogsModel(tenantDb);

        const user = await User.findOne({
            setupPasswordExpires: { $gt: Date.now() },
        });

        if (!user || !(await bcrypt.compare(token, user.setupPasswordToken))) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.setupPasswordToken = undefined;
        user.setupPasswordExpires = undefined;

        await user.save();

        // Add log entry (assuming AdminLogs is shared)
        await AdminLogs.create({
            userId: user._id,
            operationType: "password setup",
            operationsPerformed: `Password setup successful`,
            orgId: user.orgId,
        });

        res.status(200).json({ message: "Password setup successful." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error setting password." });
    }
};

// Create a new user
export const createUser = asyncHandler(async (req, res) => {
    try {
        const { orgId } = req.user;
        const { name, email, phone, role, department, gender, userType, img, status } = req.body;

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // Get the admin database model (Organizations)
        const OrgModel = await getOrgModel();

        // Check if the organization exists in the admin DB
        const existingOrganization = await OrgModel.findOne({ orgId });
        if (!existingOrganization) {
            return res.status(400).json({ message: "Organization not found. Please create the organization first." });
        }

        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId); // Ensure this returns the correct tenant DB
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Register the `User` model inside the tenant DB
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the tenant-specific `AdminLogs` model
        const AdminLogs = getAdminLogsModel(tenantDb);

        let UserTypeCode = userType === "admin" ? process.env.ADMIN : process.env.USER;

        // Generate a unique username based on email or phone
        const username = generateUsername(email, phone);

        // Create a new user instance for this tenant
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

        const updatedOrg = await OrgModel.findOneAndUpdate(
            { orgId },
            {
                $inc: { usersCount: 1 },  // Increment usersCount atomically
                ...(addedUser.userType === process.env.ADMIN
                    ? {
                        $push: { adminEmailIds: addedUser.email, adminIds: addedUser._id } // Add admin details
                    }
                    : {})
            },
            { new: true } // Return updated document
        );

        if (!updatedOrg) {
            return res.status(500).json({ message: "Failed to update organization data." });
        }

        // Send password setup email
        let emailContent = await generatePasswordSetupLink(addedUser, orgId);
        await sendPasswordSetupEmail(email, "InLuna Dashboard - Password Setup", emailContent, addedUser);

        // Emit real-time event (if using WebSockets)
        const io = req.app.get("socketio");
        if (io) {
            io.emit("userCreated", addedUser);
        }

        // Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId: req.user.userId,
                operationType: "add",
                operationsPerformed: `User created: ${name} with userType ${UserTypeCode}`,
                orgId,
                entityId: addedUser._id,
                entityType: "user"
            });
            console.log("Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error("Failed to create log in tenant DB:", logError.message);
        }

        res.status(201).json(addedUser);
    } catch (error) {
        console.error("Error creating user or log:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Create a new admin
export const createAdmin = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, phone, role, department, img, orgId } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // Get the admin database model (Organizations)
        const OrgModel = await getOrgModel();

        // Check if the organization exists in the admin DB
        const existingOrganization = await OrgModel.findOne({ orgId });
        if (!existingOrganization) {
            return res.status(400).json({ message: "Organization not found. Please create the organization first." });
        }

        // Validate new password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
        }

        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Check if the admin already exists
        const userExists = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (userExists) {
            return res.status(400).json({ message: "Admin user already exists for this tenant." });
        }

        // Generate a unique username
        const username = email.split("@")[0] + Math.floor(Math.random() * 1000);

        // Hash password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the Admin user
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
            userType: process.env.ADMIN,
        });

        await newUser.save();

        res.status(201).json({ message: "Admin user created successfully", user: newUser });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



// Get a single user by ID
export const getUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orgId } = req.user; // Extract orgId from authenticated user

    if (!orgId) {
        return res.status(400).json({ error: "Tenant ID is required." });
    }

    // Get the tenant-specific User model
    const User = await getUserModel(orgId);

    // Fetch user from the tenant database
    const user = await User.findById(id).select("-password");

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
});

// Update a user
export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orgId, userId } = req.user; // Extract from authenticated user

    if (!orgId) {
        return res.status(400).json({ error: "Tenant ID is required." });
    }

    const { username, name, email, phone, role, department } = req.body;
    const updates = { username, name, email, phone, role, department };

    try {
        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Get the correct User model for this tenant
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            console.error("AdminLogs model is not available.");
            return res.status(500).json({ message: "Failed to initialize logging model." });
        }

        // Update the user in the tenant database
        const updatedUser = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        }).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("userUpdated", updatedUser);
        }

        // Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "update",
                operationsPerformed: `User updated: ${updatedUser.name || "Unknown"}`,
                orgId,
                entityId: updatedUser._id,
                entityType: "user"
            });
            console.log("Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error("Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update User Status
export const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orgId, userId } = req.user; // Extract from authenticated user

    if (!orgId) {
        return res.status(400).json({ error: "Tenant ID is required." });
    }

    try {
        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Get the correct User model for this tenant
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            console.error("AdminLogs model is not available.");
            return res.status(500).json({ message: "Failed to initialize logging model." });
        }

        // Find the user in the tenant database
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Toggle user status
        user.status = user.status === "active" ? "inactive" : "active";
        const updatedUser = await user.save();

        // Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("userStatusUpdated", updatedUser);
        }

        // Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "update",
                operationsPerformed: `User status updated: ${updatedUser.email} to ${updatedUser.status}`,
                orgId,
                entityId: id,
                entityType: "user"
            });
            console.log("Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error("Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user status:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// update admin
export const updateAdminDetails = asyncHandler(async (req, res) => {
    try {
        const { orgId, userId } = req.user; // Extract from authenticated user

        if (!orgId) {
            return res.status(400).json({ message: "Tenant ID is required." });
        }

        const { name, email, recoveryEmail, phone, role, department, img } = req.body;

        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Update the admin user details within the tenant DB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, recoveryEmail, phone, role, department, img },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Admin user not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update admin password
export const updateAdminPwd = asyncHandler(async (req, res) => {
    try {
        const { orgId, userId } = req.user; // Extract from authenticated user
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // Validate new password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "Password must be at least 6 characters long and contain both letters and numbers." });
        }

        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Get the correct User model for this tenant
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            console.error("AdminLogs model is not available.");
            return res.status(500).json({ message: "Failed to initialize logging model." });
        }

        // Find the admin user within the tenant DB
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Admin user not found." });
        }

        // Validate old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Old password is incorrect." });
        }

        // Hash and update new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "update",
                operationsPerformed: `Admin password updated: ${user.name || "Unknown"}`,
                orgId,
                entityId: userId,
                entityType: "user"
            });
            console.log("Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error("Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// verify admin pwd
export const verifyAdminPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { orgId, userId } = req.user; // Extract from authenticated user

    if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required." });
    }

    // Get the tenant-specific User model
    const User = await getUserModel(orgId);

    // Find the admin user within the tenant DB
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ error: "Admin user not found." });
    }

    // Compare input password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password." });
    }

    res.status(200).json({ message: "Password verified." });
});

// Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orgId, userId: adminId } = req.user; // Extract from authenticated user

    if (!orgId) {
        return res.status(400).json({ error: "Organization ID is required." });
    }

    try {
        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Get the correct User model for this tenant
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            console.error("AdminLogs model is not available.");
            return res.status(500).json({ message: "Failed to initialize logging model." });
        }

        // Find the user in the tenant database
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Prevent an admin from deleting their own account
        if (user._id.toString() === adminId) {
            return res.status(403).json({ error: "You cannot delete your own account." });
        }

        const OrgModel = await getOrgModel();

        // Remove the user from the organization if they are an admin
        let updateOrgQuery = {};
        if (user.userType === process.env.ADMIN) {
            updateOrgQuery = {
                $pull: {
                    adminIds: user._id, // Remove admin ID
                    adminEmailIds: user.email // Remove admin email
                }
            };
        }

        // Atomically update the organization: decrement usersCount and remove admin if needed
        await OrgModel.findOneAndUpdate(
            { orgId },
            {
                $inc: { usersCount: -1 }, // Decrement usersCount
                ...updateOrgQuery // Apply admin removal if applicable
            },
            { new: true }
        );

        // Delete user
        await User.findByIdAndDelete(id);

        // Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("userDeleted", user._id);
        }

        // Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId: adminId,
                operationType: "delete",
                operationsPerformed: `User deleted: ${user.email}`,
                orgId: orgId,
                entityId: id,
                entityType: "user",
                entityDetails: {
                    identifier: user.email,
                    status: user.status,
                    extraInfo: `Department: ${user.department}`
                }
            });
            console.log("Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error("Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json({ message: `User ${user.email} removed successfully.` });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Users from csv
export const addUsersFromCsv = asyncHandler(async (req, res) => {
    const filePath = req.file.path;
    const users = [];
    const errors = [];
    const { orgId, userId } = req.user; // Extract from authenticated user

    if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required." });
    }

    try {
        // Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // Get the correct User model for this tenant
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

        // Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            console.error("AdminLogs model is not available.");
            return res.status(500).json({ message: "Failed to initialize logging model." });
        }

        // Fetch existing users' emails and phones in the tenant DB
        const existingEmails = new Set(await User.find().distinct("email"));
        const existingPhones = new Set(await User.find().distinct("phone"));

        const processedEmails = new Set();
        const processedPhones = new Set();

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on("data", (row) => {
                    const { Name, Email, Phone, Gender, Role, Department } = row;
                    const email = Email?.toLowerCase().trim();
                    const phone = Phone?.trim();

                    // Skip empty rows
                    if (!email || !phone || !Name || !Role || !Department) {
                        errors.push({ row, error: "Missing required fields in CSV." });
                        return;
                    }

                    // Check for duplicate emails or phones in the CSV file
                    if (processedEmails.has(email)) {
                        errors.push({ row, error: `Duplicate email in CSV: ${email}` });
                        return;
                    }
                    if (processedPhones.has(phone)) {
                        errors.push({ row, error: `Duplicate phone in CSV: ${phone}` });
                        return;
                    }

                    // Check for existing emails or phones in the database
                    if (existingEmails.has(email)) {
                        errors.push({ row, error: `Email already exists in DB: ${email}` });
                        return;
                    }
                    if (existingPhones.has(phone)) {
                        errors.push({ row, error: `Phone number already exists in DB: ${phone}` });
                        return;
                    }

                    // Process valid users
                    const name = Name.trim();
                    const gender = Gender ? Gender.toLowerCase().trim() : "other";
                    const role = Role.toLowerCase().trim();
                    const department = Department.toLowerCase().trim();

                    const username = generateUsername(email, phone);
                    users.push({ name, email, phone, gender, role, department, username, orgId });

                    processedEmails.add(email);
                    processedPhones.add(phone);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        // Return errors if found in CSV
        if (errors.length > 0) {
            return res.status(400).json({
                message: "CSV contains errors",
                errors: errors,
            });
        }

        // Insert users into the tenant database
        if (users.length > 0) {
            const insertedUsers = await User.insertMany(users);

            // Emit WebSocket Event if available
            const io = req.app.get("socketio");
            if (io) {
                io.emit("usersByCsvAdded", insertedUsers);
            }

            // Send password setup emails
            for (let user of insertedUsers) {
                console.log(user)
                try {
                    let emailContent = await generatePasswordSetupLink(user, orgId);
                    await sendPasswordSetupEmail(user.email, "InLuna Dashboard - Password Setup", emailContent, user);
                } catch (emailError) {
                    console.error(`Failed to send email to ${user.email}:`, emailError.message);
                }

                // Add Log Entry in the Correct Tenant Database
                try {
                    await AdminLogs.create({
                        userId,
                        operationType: "add",
                        operationsPerformed: "Users added via CSV",
                        orgId,
                        entityId: user._id,
                        entityType: "user",
                    });
                    console.log("Log entry created successfully in tenant DB:", orgId);
                } catch (logError) {
                    console.error("Failed to create log in tenant DB:", logError.message);
                }
            }

            const OrgModel = await getOrgModel();
            await OrgModel.findOneAndUpdate(
                { orgId },
                { $inc: { usersCount: insertedUsers.length } }, // Increase by number of inserted users
                { new: true }
            );

            res.status(200).json({ message: "Users added successfully." });
        } else {
            res.status(400).json({ message: "No valid data to add." });
        }
    } catch (error) {
        console.error("Error adding users from CSV:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    } finally {
        // Remove the uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

export const fetchProfile = asyncHandler(async (req, res) => {
    try {
        const { orgId, userId } = req.user; // Extract from authenticated user

        if (!orgId) {
            return res.status(400).json({ error: "Organization ID is required." });
        }

        // Get the tenant-specific User model
        const User = await getUserModel(orgId);

        // Find the user profile within the tenant DB
        const user = await User.findById(userId).select(
            "img name username email recoveryEmail phone role department status"
        );

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Server error" });
    }
});


