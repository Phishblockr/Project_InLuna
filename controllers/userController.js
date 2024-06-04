const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const winston = require('winston');

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
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // Exclude password from results
  res.status(users.length > 0 ? 200 : 404).json(users.length > 0 ? users : { error: 'Users not found' });
});

// Create a new user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, phone, role, department, orgId } = req.body;
    console.log(username, email, phone, role, department, orgId );
    const newUser = await User.create({
      username,
      email,
      phone,
      role,
      department,
      uuid: orgId,
    });
    await newUser.save();
    res.status(201).json(newUser)
  } catch (error) {
    console.log(error.message);
  };
});

// Get a single user by ID
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password'); // Exclude password from result
  res.status(user ? 200 : 404).json(user ? user : { error: 'User not found' });
});

// Update a user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, role, department, orgId, password } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    id,
    username,
    email,
    phone,
    role,
    department,
    orgId,
    password,
    { new: true, runValidators: true }
  ).select('-password'); // Exclude password from result
  res.status(updatedUser ? 200 : 404).json(updatedUser ? updatedUser : { error: 'User not found' });
});

// Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id).select('-password'); // Exclude password from result
  res.status(user ? 200 : 404).json(user ? { message: `User ${user.username} removed successfully` } : { error: 'User not found' });
});

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser
};
