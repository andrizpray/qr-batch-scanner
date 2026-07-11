import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { getDb } from './db.js';
import batchesRouter from './routes/batches.js';
import scansRouter from './routes/scans.js';
import exportsRouter from './routes/exports.js';

const scansLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // 5 requests per second per IP
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Attach db to request — all routes need access to req.db
app.use((req, res, next) => {
  req.db = getDb();
  next();
});

// Mount routers
app.use('/api/batches', batchesRouter);
app.use('/api/scans', scansLimiter, scansRouter);
app.use('/api/exports', exportsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
