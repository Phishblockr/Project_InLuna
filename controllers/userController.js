import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import bcrypt from 'bcryptjs';
import winston from 'winston';
import csvParser from 'csv-parser';
import fs from 'fs';
import { generateUsername } from '../utils/generateUsername.js';

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
  const id = req.user.orgId;
  const users = await User.find({ orgId: id }).select('-password');
  res.status(users.length > 0 ? 200 : 404).json(users.length > 0 ? users : { error: 'Users not found' });
});

// Create a new user
export const createUser = asyncHandler(async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { name, username, email, phone, role, department, img } = req.body;
    const newUser = new User({
      username,
      name,
      email,
      phone,
      role,
      department,
      img,
      orgId,
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
  const { username, email, phone, role, department, orgId, password } = req.body;
  const updates = {
    username,
    email,
    phone,
    role,
    department,
    orgId,
    password
  };
  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  }).select('-password');
  res.status(updatedUser ? 200 : 404).json(updatedUser ? updatedUser : { error: 'User not found' });
});

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

// Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id).select('-password');
  res.status(user ? 200 : 404).json(user ? { message: `User ${user.username} removed successfully` } : { error: 'User not found' });
});

export const addUsersFromCsv = asyncHandler(async (req, res) => {
  const filePath = req.file.path;
  const users = [];
  const orgId = req.user.orgId;

  try {
    console.log(filePath);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
          const { Name, Email, Phone, Gender, Role, Department } = row;
          const name = Name;
          const email = Email.toLowerCase();
          const phone = Phone;
          const gender = Gender.toLowerCase();
          const role = Role.toLowerCase();
          const department = Department.toLowerCase();

          const username = generateUsername(email, phone);
          console.log({ name, email, phone, gender, role, department, username, orgId });
          users.push({ name, email, phone, gender, role, department, username, orgId });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await User.insertMany(users);
    res.status(200).json({ message: 'Users added successfully' });
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