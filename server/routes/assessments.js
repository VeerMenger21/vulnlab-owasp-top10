import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/assessments - List recent assessments
router.get('/', (req, res) => {
  try {
    const { finding_id } = req.query;
    let query = 'SELECT * FROM assessments';
    const params = [];
    if (finding_id) {
      query += ' WHERE finding_id = ?';
      params.push(finding_id);
    }
    query += ' ORDER BY tested_at DESC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve assessments: ' + err.message });
  }
});

// POST /api/assessments - Record a controlled assessment execution
router.post('/', (req, res) => {
  try {
    const {
      finding_id, target_version, test_environment,
      methodology, outcome, observations, update_finding_status = true
    } = req.body;

    if (!finding_id || !target_version || !methodology || !outcome) {
      return res.status(400).json({ error: 'Missing required assessment parameters' });
    }

    const id = 'ASM-' + Date.now().toString(36).toUpperCase();

    const insertStmt = db.prepare(`
      INSERT INTO assessments (
        id, finding_id, target_version, test_environment,
        methodology, outcome, observations, tested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    insertStmt.run(id, finding_id, target_version, test_environment, methodology, outcome, observations || null);

    // If update_finding_status is requested, update finding status accordingly
    if (update_finding_status) {
      let newStatus = 'In Progress';
      if (outcome === 'Verified Vulnerable') newStatus = 'Verified Vulnerable';
      else if (outcome === 'Not Reproduced') newStatus = 'Not Reproduced';

      db.prepare(`
        UPDATE findings SET
          status = ?,
          observed_behavior = COALESCE(?, observed_behavior),
          is_seed_template = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, observations, finding_id);
    }

    const created = db.prepare('SELECT * FROM assessments WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record assessment: ' + err.message });
  }
});

export default router;
