import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import {Server} from "socket.io"
import dotenv from 'dotenv';
import winston from 'winston';

import authenticationRoutes from "./routes/authenticationRoutes.js"
import organizationRoutes from './routes/organizationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import RequestRoutes from './routes/RequestRoutes.js';
import feedbackRoutes from "./routes/feedbackRoutes.js"
import overviewRoutes from "./routes/overviewRoutes.js"
import logsRoute from "./routes/logsRoute.js"

import errorHandler from './middlewares/errorHandler.js';
import authenticateToken from "./middlewares/authenticateToken.js"
import dashboardAdminMiddleware from "./middlewares/dashboardAdminMiddleware.js"

import forgotDetailsRoutes from './routes/forgotDetailsRoutes.js';

import heartBeatRoutes from "./routes/heartBeatRoutes.js";

dotenv.config();

const app = express();
// Increase the size limit for JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

const server = http.createServer(app);
const io = new Server(server,  {
  cors: {
    origin: "http://localhost:5173", // Dashboard's URL
  }
});
app.set("socketio", io);

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
// Individual middleware to added specific routes for user
app.use('/api/user', userRoutes);

// Url Routes
app.use("/api/url", authenticateToken, urlRoutes);

// Whitelist URL Request Routes
app.use("/api/Request", authenticateToken, RequestRoutes);

// Feedback Routes
app.use("/api/feedback", authenticateToken, feedbackRoutes);

// Dashboard Routes

// Overview Page Routes
app.use("/api/overview",dashboardAdminMiddleware, overviewRoutes);

// Logs Route
app.use("/api/logs/", dashboardAdminMiddleware, logsRoute);

// forgot Details Route
app.use("/api/forgot", forgotDetailsRoutes);

// HeartBeat Route
app.use("/api/heartBeat", authenticateToken, heartBeatRoutes)

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
