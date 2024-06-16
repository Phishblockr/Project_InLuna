const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const winston = require('winston');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
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
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // Exclude password from results
  res.status(users.length > 0 ? 200 : 404).json(users.length > 0 ? users : { error: 'Users not found' });
});

// Create a new user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, phone, role, department, orgId, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    console.log(username, email, phone, role, department, orgId, password);
    const newUser = await User.create({
      username,
      email,
      phone,
      role,
      department,
      uuid: orgId,
      password: hashed
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

const loginUser = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const { username, password } = req.body;

  try {
    // Find the user by username and orgId
    const user = await User.findOne({ uuid: orgId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, orgId: user.orgId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
})

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
};
