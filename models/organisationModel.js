const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrganizationSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Organization name must be at least 2 characters long'],
    maxlength: [100, 'Organization name must be less than 100 characters long']
  },
  adminName: {
    type: String,
    trim: true,
    minlength: [2, 'Admin name must be at least 2 characters long'],
    maxlength: [100, 'Admin name must be less than 100 characters long']
  },
  totalUsers: {
    type: Number,
    required: [true, 'Total users is required'],
    min: [1, 'There must be at least one user']
  },
  statistics: {
    phishingLinksVisited: {
      type: Number,
      default: 0,
      min: [0, 'Phishing links visited cannot be negative']
    },
    linksWhitelisted: {
      type: Number,
      default: 0,
      min: [0, 'Links whitelisted cannot be negative']
    },
    blacklistedLinksClicked: {
      type: Number,
      default: 0,
      min: [0, 'Blacklisted links clicked cannot be negative']
    },
    phishingLinksBlocked: {
      type: Number,
      default: 0,
      min: [0, 'Phishing links blocked cannot be negative']
    }
  },
  uuid: {
    type: Number,
    required: [true, 'Organization ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Organization = mongoose.model('Organization', OrganizationSchema); 
module.exports = Organization;