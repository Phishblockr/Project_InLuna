const mongoose = require('mongoose');
require('dotenv').config();

const db = () => {
  mongoose.connect(process.env.MONGO_URI);
  console.log(process.env.MONGO_URI);
  console.log('MongoDB Connected');
}

module.exports = db;