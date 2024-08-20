import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organizationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import whitelistReqRoutes from './routes/whitelistReqRoutes.js';
import feedbackRoutes from "./routes/feedbackRoutes.js"
import winston from 'winston';
import errorHandler from './middlewares/errorHandler.js';

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

// Whitelist URL Request Routes
app.use("/api/whitelistReq", whitelistReqRoutes);

// Feedback Routes
app.use("/api/feedback", feedbackRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
