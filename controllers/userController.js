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
  const { id } = req.params;
  const users = await User.find({ uuid: id }).select('-password');
  res.status(users.length > 0 ? 200 : 404).json(users.length > 0 ? users : { error: 'Users not found' });
});

// Create a new user
const createUser = asyncHandler(async (req, res) => {
  try {
    const { name, username, email, phone, role, department, orgId, password, img } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('local', salt);
    console.log(req.body);
    const newUser = new User({
      username,
      name,
      email,
      phone: phone,
      role,
      department,
      img,
      uuid: orgId,
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
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');
  res.status(user ? 200 : 404).json(user ? user : { error: 'User not found' });
});

// Update a user
const updateUser = asyncHandler(async (req, res) => {
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
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id).select('-password');
  res.status(user ? 200 : 404).json(user ? { message: `User ${user.username} removed successfully` } : { error: 'User not found' });
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { uuid, username, password } = req.body;
  try {
    const user = await User.findOne({ uuid, username });

    if (!user) {
      return res.status(404).json({ error: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (username === user.username && isMatch) {
      const token = jwt.sign({ userId: user.id, orgId: user.uuid }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
};
