import HeartBeatSchema from "../models/heartBeatModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import bcrypt from "bcryptjs";
import winston from "winston";
import csvParser from "csv-parser";
import fs from "fs";
import { generateUsername } from "../utils/generateUsername.js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import UserSchema from "../models/userModel.js";
import { getUserModel, getTenantDB } from "../tenantdb.js";
import { getAdminLogsModel } from "../models/adminlogsModel.js";
import { sendPasswordSetupEmail } from "../utils/sendPasswordSetupEmail.js";
import { getOrgModel } from "../models/organisationModel.js";
import { generatePasswordSetupLink } from "../utils/generatePasswordSetupLink.js";
import { isDisposableEmail } from "../utils/isDisposableEmail.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

dotenv.config();
// Logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
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
    if (!tenantDb.models.HeartBeat)
      tenantDb.model("HeartBeat", HeartBeatSchema);

    const User = tenantDb.models.User;
    const HeartBeat = tenantDb.models.HeartBeat;

    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const statusFilter =
      status === "all"
        ? {}
        : { status: { $regex: `^${status}$`, $options: "i" } };

    const queryFilter = {
      orgId,
      removedAt: null,
      ...searchFilter,
      ...statusFilter,
    };

    const users = await User.find(queryFilter)
      .select("-password")
      .skip(skip)
      .limit(limit);
    const totalUsers = await User.countDocuments(queryFilter);

    if (users.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    const userIds = users.map((user) => user._id);

    const heartBeats = await HeartBeat.find({ userId: { $in: userIds } });

    const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
    const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD);

    const usersWithHeartBeatStatus = users.map((user) => {
      const heartBeat = heartBeats.find(
        (hb) => hb.userId.toString() === user._id.toString()
      );

      let heartBeatStatus = "not initialized";
      if (heartBeat) {
        const isInactive = heartBeat.timestamp < cutoffDate;
        const hasDownTimeToday = heartBeat.downtime.some((dt) => {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          return (
            dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday
          );
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

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        "Password must be at least 6 characters long and contain both letters and numbers.",
    });
  }

  try {
    const User = await getUserModel(orgId); // Get tenant-specific User model
    const tenantDb = await getTenantDB(orgId);
    const AdminLogs = await getAdminLogsModel(tenantDb);
    // Find the correct user by comparing the provided token with all unexpired token hashes.
    // Note: We can't query by bcrypt hash directly, so we scan eligible users and compare.
    const emailLower = (req.body.email || "").toLowerCase().trim();
    const now = Date.now();
    const query = {
      setupPasswordExpires: { $gt: now },
      setupPasswordToken: { $exists: true, $ne: null },
      ...(emailLower ? { email: emailLower } : {}),
    };
    const candidates = await User.find(query);
    let user = null;
    const rawToken = (token || "").trim();
    for (const candidate of candidates) {
      if (
        candidate.setupPasswordToken &&
        (await bcrypt.compare(rawToken, candidate.setupPasswordToken))
      ) {
        user = candidate;
        break;
      }
    }
    if (!user) {
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
    const { orgId, userId: adminId } = req.user;
    const { name, email, role, department, userType, img, status } = req.body;

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID is required." });
    }

    // Block disposable / temporary email domains
    if (email && isDisposableEmail(email)) {
      return res.status(400).json({
        message:
          "Disposable / temporary email addresses are not allowed. Please use a valid permanent email.",
      });
    }

    // Get the admin database model (Organizations)
    const OrgModel = await getOrgModel();

    // Check if the organization exists in the admin DB
    const existingOrganization = await OrgModel.findOne({ orgId });
    if (!existingOrganization) {
      return res.status(400).json({
        message:
          "Organization not found. Please create the organization first.",
      });
    }

    // Get the tenant-specific database connection
    const tenantDb = await getTenantDB(orgId); // Ensure this returns the correct tenant DB
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }

    // Register the `User` model inside the tenant DB
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

    // Get the tenant-specific `AdminLogs` model
    const AdminLogs = getAdminLogsModel(tenantDb);

    let UserTypeCode =
      userType === "admin" ? process.env.ADMIN : process.env.USER;

    const username = generateUsername(email);

    // Create a new user instance for this tenant
    const newUser = new User({
      username,
      name,
      status,
      email,
      role,
      department,
      img,
      orgId,
      userType: UserTypeCode,
    });

    // Create the user first in the tenant DB (no cross-DB session)
    let addedUser = await newUser.save();

    // Start a session from the admin DB connection and wrap admin writes atomically
    const adminConn = (await getOrgModel()).db; // same connection used by OrgModel & seat models
    const session = await adminConn.startSession();
    let updatedOrg;
    try {
      await session.withTransaction(async () => {
        const { applySeatDeltaOnce } = await import(
          "../models/seatChangeModel.js"
        );
        const { applySeatDelta } = await import("../services/seats.js");
        const at = new Date();
        // Seat metering (+1) idempotent inside transaction (admin DB only)
        await applySeatDeltaOnce({
          orgId,
          memberId: addedUser._id,
          delta: +1,
          at,
          applySeatDeltaFn: (sess) => applySeatDelta(orgId, +1, at, sess),
          session,
        });
        // Update organization counters/admin arrays (admin DB)
        updatedOrg = await OrgModel.findOneAndUpdate(
          { orgId },
          {
            $inc: { usersCount: 1 },
            ...(addedUser.userType === process.env.ADMIN
              ? {
                  $push: {
                    adminEmailIds: addedUser.email,
                    adminIds: addedUser._id,
                  },
                }
              : {}),
          },
          { new: true, session }
        );
        if (!updatedOrg) throw new Error("Failed org update in transaction");
      });
    } catch (txErr) {
      const msg = (txErr && txErr.message) || "";
      const notReplicaSet =
        msg.includes("Transaction numbers are only allowed") ||
        msg.toLowerCase().includes("replica set") ||
        txErr.code === 20; // Code 20: IllegalOperation (standalone)
      if (notReplicaSet) {
        // Fallback: perform admin updates WITHOUT a transaction
        try {
          const { applySeatDeltaOnce } = await import(
            "../models/seatChangeModel.js"
          );
          const { applySeatDelta } = await import("../services/seats.js");
          const at = new Date();
          await applySeatDeltaOnce({
            orgId,
            memberId: addedUser._id,
            delta: +1,
            at,
            applySeatDeltaFn: (sess) => applySeatDelta(orgId, +1, at, sess),
            // no session in fallback
          });
          updatedOrg = await OrgModel.findOneAndUpdate(
            { orgId },
            {
              $inc: { usersCount: 1 },
              ...(addedUser.userType === process.env.ADMIN
                ? {
                    $push: {
                      adminEmailIds: addedUser.email,
                      adminIds: addedUser._id,
                    },
                  }
                : {}),
            },
            { new: true }
          );
          if (!updatedOrg) throw new Error("Failed org update (fallback)");
        } catch (fallbackErr) {
          // Fallback failed too — attempt to roll back tenant user
          try {
            await (
              tenantDb.models.User || tenantDb.model("User", UserSchema)
            ).findByIdAndDelete(addedUser._id);
          } catch (_) {}
          session.endSession();
          throw fallbackErr;
        }
      } else {
        // Unknown failure — roll back tenant user and rethrow
        try {
          await (
            tenantDb.models.User || tenantDb.model("User", UserSchema)
          ).findByIdAndDelete(addedUser._id);
        } catch (_) {}
        session.endSession();
        throw txErr;
      }
    }
    session.endSession();

    if (!updatedOrg) {
      return res
        .status(500)
        .json({ message: "Failed to update organization data." });
    }

    // Send password setup email
    let emailContent = await generatePasswordSetupLink(addedUser, orgId);
    await sendPasswordSetupEmail(
      email,
      "InLuna Dashboard - Password Setup",
      emailContent,
      addedUser
    );

    // console.log(emailContent);

    // Emit real-time event (if using WebSockets)
    const io = req.app.get("socketio");
    if (io) {
      io.emit("userCreated", addedUser);
    }

    // Automatically trigger Razorpay seat sync for this org
    try {
      const fetch = (await import("node-fetch")).default;
      await fetch("http://localhost:5000/api/rzp/sync-quantity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
    } catch (syncErr) {
      console.error(
        "Failed to sync Razorpay seats after user creation:",
        syncErr.message
      );
    }

    // Add Log Entry in the Correct Tenant Database
    if (adminId) {
      try {
        await AdminLogs.create({
          userId: adminId,
          operationType: "add",
          operationsPerformed: `User created: ${name} with userType ${UserTypeCode}`,
          orgId,
          entityId: addedUser._id,
          entityType: "user",
        });
        console.log("Log entry created successfully in tenant DB:", orgId);
      } catch (logError) {
        console.error("Failed to create log in tenant DB:", logError.message);
      }
    } else {
      console.warn(
        "No adminId found in req.user; skipping log entry for user creation."
      );
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
    const { name, email, password, role, department, img, orgId } = req.body;

    if (!orgId) {
      return res.status(400).json({ message: "Organization ID is required." });
    }

    // Block disposable / temporary email domains
    if (email && isDisposableEmail(email)) {
      return res.status(400).json({
        message:
          "Disposable / temporary email addresses are not allowed. Please use a valid permanent email.",
      });
    }

    // Get the admin database model (Organizations)
    const OrgModel = await getOrgModel();

    // Check if the organization exists in the admin DB
    const existingOrganization = await OrgModel.findOne({ orgId });
    if (!existingOrganization) {
      return res.status(400).json({
        message:
          "Organization not found. Please create the organization first.",
      });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers.",
      });
    }

    // Get the tenant-specific User model
    const User = await getUserModel(orgId);

    // Check if the admin already exists
    const userExists = await User.findOne({
      $or: [{ email }],
    });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Admin user already exists for this tenant." });
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
      role,
      department,
      img,
      orgId,
      userType: process.env.ADMIN,
    });
    // Transaction for admin creation + seat delta + org counters
    const mongoose = (await import("mongoose")).default;
    const session = await mongoose.startSession();
    let addedAdmin;
    await session.withTransaction(async () => {
      addedAdmin = await newUser.save({ session });
      const { applySeatDeltaOnce } = await import(
        "../models/seatChangeModel.js"
      );
      const { applySeatDelta } = await import("../services/seats.js");
      const at = new Date();
      await applySeatDeltaOnce({
        orgId,
        memberId: addedAdmin._id,
        delta: +1,
        at,
        applySeatDeltaFn: (sess) => applySeatDelta(orgId, +1, at, sess),
        session,
      });
      // increment usersCount & add admin arrays
      await OrgModel.findOneAndUpdate(
        { orgId },
        {
          $inc: { usersCount: 1 },
          $push: { adminEmailIds: addedAdmin.email, adminIds: addedAdmin._id },
        },
        { session }
      );
    });
    session.endSession();

    res
      .status(201)
      .json({ message: "Admin user created successfully", user: addedAdmin });
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

  const { username, name, email, role, department } = req.body;
  const updates = { username, name, email, role, department };

  try {
    // Get the tenant-specific database connection
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }

    // Get the correct User model for this tenant
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

    // Get the correct AdminLogs model for this tenant
    const AdminLogs = getAdminLogsModel(tenantDb);
    if (!AdminLogs) {
      console.error("AdminLogs model is not available.");
      return res
        .status(500)
        .json({ message: "Failed to initialize logging model." });
    }

    // Update the user in the tenant database
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
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
        entityType: "user",
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
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }

    // Get the correct User model for this tenant
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

    // Get the correct AdminLogs model for this tenant
    const AdminLogs = getAdminLogsModel(tenantDb);
    if (!AdminLogs) {
      console.error("AdminLogs model is not available.");
      return res
        .status(500)
        .json({ message: "Failed to initialize logging model." });
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
        entityType: "user",
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

    const { name, email, recoveryEmail, role, department, img } = req.body;

    // Get the tenant-specific User model
    const User = await getUserModel(orgId);

    // Update the admin user details within the tenant DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, recoveryEmail, role, department, img },
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
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and contain both letters and numbers.",
      });
    }

    // Get the tenant-specific database connection
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }

    // Get the correct User model for this tenant
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

    // Get the correct AdminLogs model for this tenant
    const AdminLogs = getAdminLogsModel(tenantDb);
    if (!AdminLogs) {
      console.error("AdminLogs model is not available.");
      return res
        .status(500)
        .json({ message: "Failed to initialize logging model." });
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
        operationsPerformed: `Admin password updated: ${
          user.name || "Unknown"
        }`,
        orgId,
        entityId: userId,
        entityType: "user",
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
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb) {
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);
    const AdminLogs = getAdminLogsModel(tenantDb);
    if (!AdminLogs) {
      console.error("AdminLogs model is not available.");
      return res
        .status(500)
        .json({ message: "Failed to initialize logging model." });
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user._id.toString() === adminId) {
      return res
        .status(403)
        .json({ error: "You cannot delete your own account." });
    }
    if (user.removedAt) {
      return res.status(400).json({ error: "User already removed." });
    }
    const OrgModel = await getOrgModel();
    // Soft delete: set removedAt timestamp and status -> inactive
    const now = new Date();
    try {
      const { previewCycle } = await import("../services/billing.js");
      const cycle = await previewCycle(orgId, now);
      // Always set removedAt to the END of the current billing cycle
      user.removedAt = new Date(cycle.cycleEnd);
    } catch (e) {
      user.removedAt = now; // fallback
    }
    // First update tenant user (no cross-DB session)
    user.status = "inactive";
    await user.save();

    // Start a session from the admin DB connection and wrap admin writes atomically
    const adminConn = (await getOrgModel()).db;
    const session = await adminConn.startSession();
    try {
      await session.withTransaction(async () => {
        // org update
        let updateOrgQuery = {};
        if (user.userType === process.env.ADMIN) {
          updateOrgQuery = {
            $pull: { adminIds: user._id, adminEmailIds: user.email },
          };
        }
        await OrgModel.findOneAndUpdate(
          { orgId },
          { $inc: { usersCount: -1 }, ...updateOrgQuery },
          { session }
        );
        // seat delta idempotent
        try {
          const { applySeatDeltaOnce } = await import(
            "../models/seatChangeModel.js"
          );
          const { applySeatDelta } = await import("../services/seats.js");
          const at = user.removedAt;
          await applySeatDeltaOnce({
            orgId,
            memberId: user._id,
            delta: -1,
            at,
            applySeatDeltaFn: (sess) => applySeatDelta(orgId, -1, at, sess),
            session,
          });
        } catch (e) {
          console.error("Seat -1 metering failed (deleteUser):", e.message);
        }
      });
    } catch (txErr) {
      const msg = (txErr && txErr.message) || "";
      const notReplicaSet =
        msg.includes("Transaction numbers are only allowed") ||
        msg.toLowerCase().includes("replica set") ||
        txErr.code === 20; // Code 20: IllegalOperation (standalone)
      if (notReplicaSet) {
        // Fallback: perform admin updates WITHOUT a transaction
        try {
          // org update without session
          let updateOrgQuery = {};
          if (user.userType === process.env.ADMIN) {
            updateOrgQuery = {
              $pull: { adminIds: user._id, adminEmailIds: user.email },
            };
          }
          await OrgModel.findOneAndUpdate(
            { orgId },
            { $inc: { usersCount: -1 }, ...updateOrgQuery },
            { new: true }
          );
          // seat delta without session
          try {
            const { applySeatDeltaOnce } = await import(
              "../models/seatChangeModel.js"
            );
            const { applySeatDelta } = await import("../services/seats.js");
            const at = user.removedAt;
            await applySeatDeltaOnce({
              orgId,
              memberId: user._id,
              delta: -1,
              at,
              applySeatDeltaFn: (sess) => applySeatDelta(orgId, -1, at, sess),
              // no session
            });
          } catch (e) {
            console.error(
              "Seat -1 metering failed (deleteUser fallback):",
              e.message
            );
          }
        } catch (fallbackErr) {
          // Fallback failed — attempt to roll back tenant user changes
          try {
            user.status = "active";
            user.removedAt = null;
            await user.save();
          } catch (_) {}
          session.endSession();
          throw fallbackErr;
        }
      } else {
        // Unknown failure — roll back tenant user and rethrow
        try {
          user.status = "active";
          user.removedAt = null;
          await user.save();
        } catch (_) {}
        session.endSession();
        throw txErr;
      }
    }
    session.endSession();

    const io = req.app.get("socketio");
    if (io) {
      io.emit("userDeleted", user._id);
    }
    try {
      await AdminLogs.create({
        userId: adminId,
        operationType: "delete",
        operationsPerformed: `User soft-deleted: ${user.email}`,
        orgId: orgId,
        entityId: id,
        entityType: "user",
        entityDetails: {
          identifier: user.email,
          status: user.status,
          removedAt: user.removedAt,
          extraInfo: `Department: ${user.department}`,
        },
      });
    } catch (logError) {
      console.error("Failed to create log in tenant DB:", logError.message);
    }
    // Automatically trigger Razorpay seat sync for this org
    try {
      const fetch = (await import("node-fetch")).default;
      await fetch("http://localhost:5000/api/rzp/sync-quantity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
    } catch (syncErr) {
      console.error(
        "Failed to sync Razorpay seats after user deletion:",
        syncErr.message
      );
    }

    res.status(200).json({
      message: `User ${user.email} removed successfully and seat sync triggered.`,
      removedAt: user.removedAt,
    });
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
      return res
        .status(500)
        .json({ message: "Failed to get tenant database." });
    }

    // Get the correct User model for this tenant
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);

    // Get the correct AdminLogs model for this tenant
    const AdminLogs = getAdminLogsModel(tenantDb);
    if (!AdminLogs) {
      console.error("AdminLogs model is not available.");
      return res
        .status(500)
        .json({ message: "Failed to initialize logging model." });
    }

    // Fetch existing users' emails in the tenant DB
    const existingEmails = new Set(await User.find().distinct("email"));

    const processedEmails = new Set();

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => {
          const { Name, Email, Role, Department } = row;
          const email = Email?.toLowerCase().trim();

          // Skip empty rows
          if (!email || !Name || !Role || !Department) {
            errors.push({ row, error: "Missing required fields in CSV." });
            return;
          }

          // Check for duplicate emails in the CSV file
          if (processedEmails.has(email)) {
            errors.push({ row, error: `Duplicate email in CSV: ${email}` });
            return;
          }

          // Check for existing emails in the database
          if (existingEmails.has(email)) {
            errors.push({ row, error: `Email already exists in DB: ${email}` });
            return;
          }

          // Process valid users
          const name = Name.trim();
          const role = Role.toLowerCase().trim();
          const department = Department.toLowerCase().trim();

          const username = generateUsername(email);
          users.push({ name, email, role, department, username, orgId });

          processedEmails.add(email);
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
      // Use a transaction for bulk insert + org usersCount increment + seat deltas
      const mongoose = (await import("mongoose")).default;
      const session = await mongoose.startSession();
      let insertedUsers = [];
      await session.withTransaction(async () => {
        insertedUsers = await User.insertMany(users, { session });
        const OrgModel = await getOrgModel();
        await OrgModel.findOneAndUpdate(
          { orgId },
          { $inc: { usersCount: insertedUsers.length } },
          { session }
        );
        // Seat deltas inside transaction
        for (let user of insertedUsers) {
          try {
            const { applySeatDeltaOnce } = await import(
              "../models/seatChangeModel.js"
            );
            const { applySeatDelta } = await import("../services/seats.js");
            const at = new Date();
            await applySeatDeltaOnce({
              orgId,
              memberId: user._id,
              delta: +1,
              at,
              applySeatDeltaFn: (sess) => applySeatDelta(orgId, +1, at, sess),
              session,
            });
          } catch (meterErr) {
            console.error(
              "Seat +1 metering failed (CSV import - in tx):",
              meterErr.message
            );
          }
        }
      });
      session.endSession();

      // Emit WebSocket Event if available
      const io = req.app.get("socketio");
      if (io) {
        io.emit("usersByCsvAdded", insertedUsers);
      }

      // Send password setup emails
      for (let user of insertedUsers) {
        console.log(user);
        try {
          let emailContent = await generatePasswordSetupLink(user, orgId);
          await sendPasswordSetupEmail(
            user.email,
            "InLuna Dashboard - Password Setup",
            emailContent,
            user
          );
        } catch (emailError) {
          console.error(
            `Failed to send email to ${user.email}:`,
            emailError.message
          );
        }

        // Seat delta already applied inside transaction; no action here

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

      // Org usersCount increment already applied in transaction

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
      "img name username email recoveryEmail role department status"
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

// Restore a soft-deleted user
export const restoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orgId, userId: adminId } = req.user;
  if (!orgId)
    return res.status(400).json({ error: "Organization ID is required." });
  try {
    const tenantDb = await getTenantDB(orgId);
    if (!tenantDb)
      return res.status(500).json({ error: "Failed to get tenant database." });
    const User = tenantDb.models.User || tenantDb.model("User", UserSchema);
    const AdminLogs = getAdminLogsModel(tenantDb);
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.removedAt === null)
      return res.status(400).json({ error: "User is not removed." });

    const OrgModel = await getOrgModel();
    const mongoose = (await import("mongoose")).default;
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      user.removedAt = null;
      if (user.status === "inactive") user.status = "active";
      await user.save({ session });
      await OrgModel.findOneAndUpdate(
        { orgId },
        { $inc: { usersCount: 1 } },
        { session }
      );
      try {
        const { applySeatDeltaOnce } = await import(
          "../models/seatChangeModel.js"
        );
        const { applySeatDelta } = await import("../services/seats.js");
        const at = new Date();
        await applySeatDeltaOnce({
          orgId,
          memberId: user._id,
          delta: +1,
          at,
          applySeatDeltaFn: (sess) => applySeatDelta(orgId, +1, at, sess),
          session,
        });
      } catch (meterErr) {
        console.error(
          "Seat +1 metering failed (restoreUser):",
          meterErr.message
        );
      }
    });
    session.endSession();

    try {
      await AdminLogs.create({
        userId: adminId,
        operationType: "update",
        operationsPerformed: `User restored: ${user.email}`,
        orgId,
        entityId: user._id,
        entityType: "user",
        entityDetails: { identifier: user.email },
      });
    } catch (e) {
      console.error("Restore log failed", e.message);
    }

    res.status(200).json({ message: "User restored successfully." });
  } catch (e) {
    console.error("Error restoring user:", e.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
