import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database on startup
try {
  getDb();
  console.log('Database initialized successfully');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

// Placeholder routes
app.get('/api/users', (req, res) => {
  res.json({ message: 'Users endpoint - to be implemented' });
});

app.get('/api/qr-codes', (req, res) => {
  res.json({ message: 'QR codes endpoint - to be implemented' });
});

app.get('/api/scans', (req, res) => {
  res.json({ message: 'Scans endpoint - to be implemented' });
});

app.get('/api/batches', (req, res) => {
  res.json({ message: 'Batches endpoint - to be implemented' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`QR Batch Scanner server running on port ${PORT}`);
});

export { app, server };
