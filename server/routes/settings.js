import express from 'express';
import { db } from '../db.js';
import { seedDatabase } from '../seed.js';

const router = express.Router();

// GET /api/settings - Fetch all settings
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settingsObj = {};
    for (const r of rows) {
      settingsObj[r.key] = r.value;
    }
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings: ' + err.message });
  }
});

// PUT /api/settings - Update settings
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const updateMany = db.transaction((obj) => {
      for (const [key, val] of Object.entries(obj)) {
        updateStmt.run(key, String(val));
      }
    });

    updateMany(updates);

    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settingsObj = {};
    for (const r of rows) settingsObj[r.key] = r.value;
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings: ' + err.message });
  }
});

// POST /api/settings/reset - Reset database to clean initial seed templates
router.post('/reset', (req, res) => {
  try {
    seedDatabase(true);
    res.json({ success: true, message: 'Database successfully reset to initial seed templates.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

export default router;
