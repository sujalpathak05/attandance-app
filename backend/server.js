const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
require('dotenv').config();

const app = express();

// ── 1. SECURITY HEADERS (helmet) ──────────────────────────────────────────────
// Prevents XSS, clickjacking, MIME sniffing, etc.
app.use(helmet({
  contentSecurityPolicy: false, // Disabled — React handles its own CSP
  crossOriginEmbedderPolicy: false
}));

// ── 2. CORS — only allow our frontend ────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : [])
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl in dev)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── 3. BODY SIZE LIMIT ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 4. NOSQL INJECTION PREVENTION ────────────────────────────────────────────
// Strips $ and . from request body/params/query to block { "$gt": "" } attacks
app.use(mongoSanitize({ replaceWith: '_' }));

// ── 5. HTTP PARAMETER POLLUTION PREVENTION ───────────────────────────────────
app.use(hpp());

// ── 6. MALICIOUS BOT BLOCKING ────────────────────────────────────────────────
// Note: X-Forwarded-For chain check removed — cloud platforms (Render, Netlify)
// legitimately add multiple IPs via their load balancers.
app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  const badAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab'];
  if (badAgents.some(b => ua.toLowerCase().includes(b.toLowerCase()))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
});

// ── 7. TRUST PROXY (Render/Netlify run behind load balancers) ────────────────
app.set('trust proxy', 1);

// ── 8. GLOBAL RATE LIMIT — all routes (100 req/15min per IP) ─────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bahut zyada requests. 15 minute baad try karo.' }
});
app.use('/api/', globalLimiter);

// ── 9. STRICT RATE LIMIT on login (5 attempts / 15min) ───────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // Only count failed attempts
  message: { message: 'Zyada failed login attempts. 15 minute baad try karo.' }
});
app.use('/api/auth/login', loginLimiter);

async function startServer() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI environment variable not set!');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Atlas Connected!');
    await seedAdminForPreview();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/leave', require('./routes/leave'));
  app.use('/api/employee', require('./routes/employee'));

  // 404 handler — don't reveal stack traces
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Global error handler — never send stack to client
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ message: 'Server error' });
  });

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log('Security: helmet | rate-limit | mongo-sanitize | hpp | proxy-block');
    console.log('─────────────────────────────────');
    console.log('Admin Login:');
    console.log('  Email   : admin@company.com');
    console.log('  Password: Admin@123');
    console.log('─────────────────────────────────');
  });
}

async function seedAdminForPreview() {
  const User = require('./models/User');
  const exists = await User.findOne({ email: 'admin@company.com' });
  if (!exists) {
    const admin = new User({
      name: 'Super Admin',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin'
    });
    await admin.save();
    console.log('Default admin seeded');
  }
}

startServer();
