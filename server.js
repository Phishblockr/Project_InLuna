const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const organizationRoutes = require('./routes/organizationRoutes');
const userRoutes = require('./routes/userRoutes');
const urlRoutes = require("./routes/urlRoutes");
const winston = require('winston');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.log(err);
    logger.error(err.message);
  });

// Organization Routes
app.use('/api/org', organizationRoutes);

// Users Routes
app.use('/api/user', userRoutes);

// Url Routes
app.use("/api/url", urlRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
