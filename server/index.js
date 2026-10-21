import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';

import findingsRouter from './routes/findings.js';
import assessmentsRouter from './routes/assessments.js';
import evidenceRouter from './routes/evidence.js';
import remediationRouter from './routes/remediation.js';
import retestingRouter from './routes/retesting.js';
import healthRouter from './routes/health.js';
import companionRouter from './routes/companion.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';

// Ensure data and uploads directories exist
const dataDir = path.resolve(__dirname, '../data');
const uploadsDir = path.resolve(__dirname, '../uploads/evidence');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Initialize database schema and seed templates if needed
initDatabase();
seedDatabase(false);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded evidence statically with safe headers (avoid executing HTML or JS)
app.use('/uploads/evidence', (req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  next();
}, express.static(uploadsDir));

// API Routes
app.use('/api/findings', findingsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/remediation', remediationRouter);
app.use('/api/retesting', retestingRouter);
app.use('/api/health', healthRouter);
app.use('/api/companion', companionRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

// Health check endpoint for portal itself
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VulnLab API Server',
    target: 'OWASP Juice Shop Assessment Lab',
    timestamp: new Date().toISOString()
  });
});

// In production, serve Vite client build from ../dist if present
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[VulnLab Server Error]', err);
  res.status(500).json({ error: 'Server internal error: ' + err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`[VulnLab Server] Running at http://${HOST}:${PORT}`);
  console.log(`[VulnLab Server] Target configured as http://127.0.0.1:3000`);
  console.log(`[VulnLab Server] Companion lab active at http://${HOST}:${PORT}/api/companion`);
});
