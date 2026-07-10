import express from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use env variable for secret — fallback only for local dev
const SECRET_KEY = process.env.JWT_SECRET || 'stained_blooms_dev_secret_change_in_production';

// Allowed origins — configurable via env
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../public/images/uploads');
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

// ─── Security Headers Middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ─── Rate Limiter (in-memory, for login endpoint) ────────────────────────────
const loginAttempts = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    // Expire old window
    if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
      return next();
    }
    if (record.count >= RATE_LIMIT_MAX) {
      const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttempt)) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    record.count += 1;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
  next();
}

// ─── Multer setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'));
    }
  }
});

// ─── Authentication Middleware ─────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ─── Data helpers ─────────────────────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data.json');

async function readData() {
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Login
app.post('/api/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username === 'admin' && password === 'stainedbloom123') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
    // Reset rate limit on successful login
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    loginAttempts.delete(ip);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get data by key (public)
app.get('/api/data/:key', async (req, res) => {
  try {
    const db = await readData();
    const key = req.params.key;
    if (db[key] !== undefined) {
      res.json(db[key]);
    } else {
      res.status(404).json({ error: 'Key not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error reading data' });
  }
});

// Get all data (public)
app.get('/api/data', async (req, res) => {
  try {
    const db = await readData();
    res.json(db);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error reading data' });
  }
});

// Save data by key (Protected)
app.post('/api/data/:key', authenticateToken, async (req, res) => {
  try {
    const db = await readData();
    const key = req.params.key;
    db[key] = req.body.data;
    await writeData(db);
    res.json({ success: true, message: `Saved ${key} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error saving data' });
  }
});

// Upload image (Protected)
app.post('/api/upload', authenticateToken, (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/images/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });
});

// Delete uploaded image (Protected)
app.delete('/api/images/:filename', authenticateToken, async (req, res) => {
  try {
    // Sanitize filename — only allow alphanumeric, dash, dot, underscore
    const filename = req.params.filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (!filename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filepath = path.join(UPLOADS_DIR, filename);

    // Ensure the resolved path is within the uploads directory (path traversal guard)
    const resolved = path.resolve(filepath);
    const uploadsResolved = path.resolve(UPLOADS_DIR);
    if (!resolved.startsWith(uploadsResolved + path.sep)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fs.unlink(resolved);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File already gone — treat as success
      return res.json({ success: true, message: 'File not found, already deleted' });
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
