import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const uploadDir = path.resolve(__dirname, '../../uploads/evidence');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage with sanitized filenames and extension whitelisting
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'text/plain', 'application/json', 'text/markdown', 'application/pdf'
];

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type ${file.mimetype}. Allowed: PNG, JPEG, WEBP, TXT, JSON, PDF.`));
    }
  }
});

// GET /api/evidence - List all evidence with optional filter
router.get('/', (req, res) => {
  try {
    const { finding_id, evidence_type } = req.query;
    let query = 'SELECT * FROM evidence WHERE 1=1';
    const params = [];

    if (finding_id) {
      query += ' AND finding_id = ?';
      params.push(finding_id);
    }

    if (evidence_type) {
      query += ' AND evidence_type = ?';
      params.push(evidence_type);
    }

    query += ' ORDER BY captured_at DESC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve evidence: ' + err.message });
  }
});

// GET /api/evidence/:id
router.get('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Evidence record not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch evidence: ' + err.message });
  }
});

// POST /api/evidence - Create structured HTTP evidence record
router.post('/', (req, res) => {
  try {
    const {
      finding_id, assessment_id, title, evidence_type, description,
      redaction_status = 'Redacted', test_stage = 'Vulnerability Verification',
      http_method, http_path, http_headers, http_body,
      http_status, http_response_headers, http_response_body
    } = req.body;

    if (!finding_id || !title || !evidence_type) {
      return res.status(400).json({ error: 'finding_id, title, and evidence_type are required' });
    }

    const id = 'EVID-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const stmt = db.prepare(`
      INSERT INTO evidence (
        id, finding_id, assessment_id, title, filename, original_name,
        mime_type, file_size, evidence_type, description, redaction_status,
        test_stage, http_method, http_path, http_headers, http_body,
        http_status, http_response_headers, http_response_body, captured_at
      ) VALUES (
        ?, ?, ?, ?, NULL, NULL,
        'application/json', 0, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      id, finding_id, assessment_id || null, title,
      evidence_type, description || null, redaction_status,
      test_stage, http_method || null, http_path || null, http_headers || null, http_body || null,
      http_status || null, http_response_headers || null, http_response_body || null
    );

    const created = db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record evidence: ' + err.message });
  }
});

// POST /api/evidence/upload - File upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      finding_id, assessment_id, title, evidence_type = 'Screenshot',
      description, redaction_status = 'Redacted', test_stage = 'Vulnerability Verification'
    } = req.body;

    if (!finding_id) {
      return res.status(400).json({ error: 'finding_id is required' });
    }

    const id = 'EVID-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const stmt = db.prepare(`
      INSERT INTO evidence (
        id, finding_id, assessment_id, title, filename, original_name,
        mime_type, file_size, evidence_type, description, redaction_status,
        test_stage, captured_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      id, finding_id, assessment_id || null, title || req.file.originalname,
      req.file.filename, req.file.originalname, req.file.mimetype, req.file.size,
      evidence_type, description || null, redaction_status, test_stage
    );

    const created = db.prepare('SELECT * FROM evidence WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'File upload failed: ' + err.message });
  }
});

// DELETE /api/evidence/:id
router.delete('/:id', (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Evidence record not found' });

    if (item.filename) {
      const fullPath = path.join(uploadDir, item.filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    db.prepare('DELETE FROM evidence WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Evidence deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete evidence: ' + err.message });
  }
});

export default router;
