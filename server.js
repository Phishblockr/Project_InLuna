import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authenticationRoutes from "./routes/authenticationRoutes.js"
import organizationRoutes from './routes/organizationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import whitelistReqRoutes from './routes/whitelistReqRoutes.js';
import feedbackRoutes from "./routes/feedbackRoutes.js"
import overviewRoutes from "./routes/overviewRoutes.js"
import winston from 'winston';
import errorHandler from './middlewares/errorHandler.js';
import authenticateToken from "./middlewares/authenticateToken.js"
import dashboardAdminMiddleware from "./middlewares/dashboardAdminMiddleware.js"

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

// Authentication Routes
app.use("/api/auth", authenticationRoutes);

// Users Routes
app.use('/api/user', dashboardAdminMiddleware, userRoutes);

// Url Routes
app.use("/api/url", authenticateToken, urlRoutes);

// Whitelist URL Request Routes
app.use("/api/whitelistReq", authenticateToken, whitelistReqRoutes);

// Feedback Routes
app.use("/api/feedback", authenticateToken, feedbackRoutes);

// Dashboard Routes

// Overview Page Routes
app.use("/api/overview",dashboardAdminMiddleware, overviewRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
