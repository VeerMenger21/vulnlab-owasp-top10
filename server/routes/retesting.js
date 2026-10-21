import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/retests - List retests
router.get('/', (req, res) => {
  try {
    const { finding_id } = req.query;
    let query = `
      SELECT r.*, f.title as finding_title, f.severity, f.category
      FROM retests r
      JOIN findings f ON r.finding_id = f.id
    `;
    const params = [];
    if (finding_id) {
      query += ' WHERE r.finding_id = ?';
      params.push(finding_id);
    }
    query += ' ORDER BY r.retested_at DESC';
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve retests: ' + err.message });
  }
});

// POST /api/retests - Record a retest execution
router.post('/', (req, res) => {
  try {
    const {
      finding_id, remediation_id, target_tested, test_methodology,
      expected_result, actual_result, outcome, notes, update_finding_status = true
    } = req.body;

    if (!finding_id || !target_tested || !test_methodology || !expected_result || !actual_result || !outcome) {
      return res.status(400).json({ error: 'Missing required retest fields' });
    }

    const id = 'RET-' + Date.now().toString(36).toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO retests (
        id, finding_id, remediation_id, target_tested, test_methodology,
        expected_result, actual_result, outcome, notes, retested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id, finding_id, remediation_id || null, target_tested, test_methodology,
      expected_result, actual_result, outcome, notes || null
    );

    // Update finding status and remediation status if outcome is Fix Verified
    if (update_finding_status) {
      if (outcome === 'Fix Verified') {
        db.prepare(`
          UPDATE findings SET
            status = 'Retested',
            is_seed_template = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(finding_id);

        if (remediation_id) {
          db.prepare(`
            UPDATE remediations SET
              implementation_status = 'Verified',
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(remediation_id);
        }
      } else if (outcome === 'Retest Failed') {
        db.prepare(`
          UPDATE findings SET
            status = 'Verified Vulnerable',
            is_seed_template = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(finding_id);
      }
    }

    const created = db.prepare('SELECT * FROM retests WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record retest: ' + err.message });
  }
});

export default router;
