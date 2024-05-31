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
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  type: {
    type: String,
    enum: ['normal', 'admin'],
    default: 'normal'
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'manager', 'executive'],
    default: 'user'
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
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
  }
});

// Compile the schema into a model
const User = mongoose.model('User', userSchema);

module.exports = User;
