import dotenv from "dotenv";
dotenv.config();
import axios from 'axios';
import connectDB from "./config/db";
import express from "express";
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import cattleRoutes from './routes/cattle';
import locationRoutes from './routes/location';
import userRoutes from './routes/user';

// 1. Check required prod variables
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error("FATAL ERROR: Missing env secrets. Check Render Environment Variables.");
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 2424;

// 2. Strict CORS Rules
// Bulletproof Capacitor CORS Rules
const corsOptions = {
  // 1. ALLOW ALL ORIGINS (Reflects the incoming origin dynamically)
  origin: (origin: any, callback: any) => {
    callback(null, true);
  },

  // 2. ALLOW ALL METHODS
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

  // 3. ALLOW CREDENTIALS (Cookies, Authorization headers)
  credentials: true,

  // 4. ALLOW ALL HEADERS 
  // By completely omitting the 'allowedHeaders' property, the cors package 
  // will automatically read the incoming 'Access-Control-Request-Headers' 
  // and echo them back as fully approved!

  optionsSuccessStatus: 200
};

// 3. GLOBAL MIDDLEWARE (Must be at the top!)
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors(corsOptions));

// HTTP Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | IP: ${req.ip}`);
  next();
});

// 4. THE DAISY-CHAIN PING SETUP
app.get('/api/health', (req, res) => {
  res.status(200).send("Express Server is Awake and running!");
});

const DL_API_URL = process.env.DL_API_URL;
if (DL_API_URL) {
  setInterval(async () => {
    try {
      await axios.get(`${DL_API_URL}/docs`);
      console.log("Internal Ping: Kept DL Server awake.");
    } catch (error: any) {
      console.error("Internal Ping Failed:", error.message);
    }
  }, 10 * 60 * 1000);
}

// 5. RATE LIMITING & DATABASE
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

connectDB();

// 6. ROUTES
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cattle', cattleRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/user', userRoutes);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get("/", (req, res) => {
  res.send("Hello World! API running");
});

// 7. START SERVER
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});