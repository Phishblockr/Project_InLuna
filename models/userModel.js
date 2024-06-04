const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the user schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    minlength: 6
  },
  phone: {
    type: String,
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  type: {
    type: String,
    enum: ['local', 'read-only', 'admin', 'super-admin'],
    default: 'local'
  },
  role: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: Number,
    required: [true, 'Organization ID is required']
  }
});

// Compile the schema into a model
const User = mongoose.model('User', userSchema);
module.exports = User;
