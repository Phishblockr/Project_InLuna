import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import winston from 'winston';

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
  const { id } = req.params;
  const users = await User.find({ orgId: id }).select('-password');
  res.status(users.length > 0 ? 200 : 404).json(users.length > 0 ? users : { error: 'Users not found' });
});

// Create a new user
export const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, username, email, phone, role, department, orgId, password, img } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('local', salt);
    console.log(req.body);
    const newUser = new User({
      username,
      name,
      email,
      phone,
      role,
      department,
      img,
      orgId,
      password: hashedPassword
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

// Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id).select('-password');
  res.status(user ? 200 : 404).json(user ? { message: `User ${user.username} removed successfully` } : { error: 'User not found' });
});

export const fetchProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("img name username email phone role department status")
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  };
};