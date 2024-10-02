import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import bcrypt from 'bcryptjs';
import winston from 'winston';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateUsername } from '../utils/generateUsername.js';
import dotenv from 'dotenv';

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
  if (users.length > 0) {
    res.status(200).json({ users, currentPage: page, totalPages: Math.ceil(totalUsers / limit), totalUsers })
  } else {
    res.status(400).json({ error: "Users not found" })
  }
});

// Create a new user
export const createUser = asyncHandler(async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { name, email, phone, role, department, gender, userType, img } = req.body;

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
    const io = req.app.get("socketio");
    io.emit("userCreated", addedUser);

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
  const { username, name, email, phone, role, department, orgId } = req.body;
  const updates = {
    username,
    name,
    email,
    phone,
    role,
    department,
    orgId,
  };
  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  }).select('-password');
  if (updatedUser) {
    const io = req.app.get('socketio');
    io.emit('userUpdated', updatedUser);

    res.status(200).json(updatedUser);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Update User Status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-password");
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.status = user.status === "active" ? "inactive" : "active";
  const updatedUser = await user.save();

  const io = req.app.get("socketio");
  io.emit("userUpdated", updatedUser);

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
  const user = await User.findById(id).select('-password');
  if (user) {
    const userId = user._id.toString()
    if (userId === adminId) {
      res.status(403).json({ error: "You cannot delete your own account" })
    } else {
      await User.findByIdAndDelete(id);
      const io = req.app.get('socketio');
      io.emit('userDeleted', user._id);

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