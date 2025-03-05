import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from "socket.io"
import winston from 'winston';

import authenticationRoutes from "./routes/authenticationRoutes.js";
import organizationRoutes from './routes/organizationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import RequestRoutes from './routes/RequestRoutes.js';
import feedbackRoutes from "./routes/feedbackRoutes.js";
import overviewRoutes from "./routes/overviewRoutes.js";
import logsRoute from "./routes/logsRoute.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import phishtankRoutes from "./routes/phishtankRoutes.js";
import urlhausRoutes from "./routes/urlhausRoutes.js"
// import templateRoutes from "./routes/templateRoutes.js";
// import blogRoutes from "./routes/blogRoutes.js";
import errorHandler from './middlewares/errorHandler.js';
import authenticateToken from "./middlewares/authenticateToken.js";
import dashboardAdminMiddleware from "./middlewares/dashboardAdminMiddleware.js";

import forgotDetailsRoutes from './routes/forgotDetailsRoutes.js';

import heartBeatRoutes from "./routes/heartBeatRoutes.js";

import cookieParser from 'cookie-parser';

// import fetchAndSavePhishtankData from './cronJobs/phishtankJob.js';
// import fetchAndSaveUrlhausData from './cronJobs/urlhausService.js';

// Training Platform
import emailTemplateRoutes from "./routes/trainingPlatform/emailTemplateRoutes.js";
import courseRoutes from "./routes/trainingPlatform/courseRoutes.js";
import userCourseRoutes from "./routes/trainingPlatform/userCourseRoutes.js"

import tenantRoutes from "./routes/tenantRoutes.js"
import superAdminRoutes from "./routes/superAdmin/superAdminRoutes.js"

import bookADemoRoutes from "./routes/superAdmin/bookADemoRoutes.js"

import dotenv from "dotenv";
dotenv.config({ override: true });

import "./utils/tokenEncryption.js";


const app = express();
// Increase the size limit for JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// CORS Configuration
// Development only
const allowedOrigins = [
    'http://localhost:5173',
    'chrome-extension://',
    'moz-extension://',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5000',
    'https://theinluna.com',
    'https://dashboard.theinluna.com',
    'https://training.theinluna.com',
    'https://superdashboard.theinluna.com',
    /^https?:\/\/.*\.lvh\.me(?::\d+)?$/
  ];
  
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, Postman)
        if (!origin) return callback(null, true);
  
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === 'string') {
            return origin.startsWith(allowed);
          }
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
  
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    })
  );

// Production
// const allowedOrigins = ['http://domain.com/', 'chrome-extension://<PUBLISHED_EXTENSION_ID>']; // Replace with your frontend origin(s)

// app.use(
//     cors({
//         origin: function (origin, callback) {
//             if (!origin || allowedOrigins.includes(origin)) {
//                 callback(null, true);
//             } else {
//                 callback(new Error('Not allowed by CORS'));
//             }
//         },
//         credentials: true, // Allow cookies and credentials
//     })
// );

app.use(cookieParser());


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // ALl Origin for dev purposes
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
app.use("/api/overview", dashboardAdminMiddleware, overviewRoutes);

// Logs Route
app.use("/api/logs/", dashboardAdminMiddleware, logsRoute);

// forgot Details Route
app.use("/api/forgot", forgotDetailsRoutes);

// HeartBeat Route
app.use("/api/heartBeat", authenticateToken, heartBeatRoutes)

// Campaign Routes
app.use('/api/campaign', dashboardAdminMiddleware, campaignRoutes);

// Phishtank Routes
app.use('/api/phishtank', phishtankRoutes);

// Urlhaus (abuse) Routes
app.use("/api/urlhaus", urlhausRoutes);

// Template Route
// app.use('/api/template', dashboardAdminMiddleware, templateRoutes);

// blog Route
// app.use('/api/template', dashboardAdminMiddleware, blogRoutes);

// Training Platform Routes
app.use("/api/emailTemplate", emailTemplateRoutes)

app.use("/api/course", courseRoutes)

app.use("/api/userCourse", userCourseRoutes)

app.use("/api/tenant", tenantRoutes)

app.use("/api/superadmin", superAdminRoutes)

app.use("/api/bookADemo", bookADemoRoutes)


// Start cron job
// fetchAndSavePhishtankData();
// fetchAndSaveUrlhausData();

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
