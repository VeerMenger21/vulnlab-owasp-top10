import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/remediations - List all remediation records
router.get('/', (req, res) => {
  try {
    const remediations = db.prepare(`
      SELECT r.*, f.title as finding_title, f.severity, f.status as finding_status, f.category
      FROM remediations r
      JOIN findings f ON r.finding_id = f.id
      ORDER BY r.updated_at DESC
    `).all();
    res.json(remediations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve remediations: ' + err.message });
  }
});

// GET /api/remediations/:findingId - Get remediation by finding ID
router.get('/:findingId', (req, res) => {
  try {
    const remediation = db.prepare('SELECT * FROM remediations WHERE finding_id = ?').get(req.params.findingId);
    if (!remediation) return res.status(404).json({ error: 'Remediation record not found' });
    res.json(remediation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch remediation: ' + err.message });
  }
});

// PUT /api/remediations/:id - Update remediation
router.put('/:id', (req, res) => {
  try {
    const {
      root_cause, recommended_fix, implementation_status,
      secure_pattern, vulnerable_pattern, verification_notes, remaining_limitations
    } = req.body;

    const stmt = db.prepare(`
      UPDATE remediations SET
        root_cause = COALESCE(?, root_cause),
        recommended_fix = COALESCE(?, recommended_fix),
        implementation_status = COALESCE(?, implementation_status),
        secure_pattern = COALESCE(?, secure_pattern),
        vulnerable_pattern = COALESCE(?, vulnerable_pattern),
        verification_notes = COALESCE(?, verification_notes),
        remaining_limitations = COALESCE(?, remaining_limitations),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      root_cause, recommended_fix, implementation_status,
      secure_pattern, vulnerable_pattern, verification_notes, remaining_limitations,
      req.params.id
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Remediation not found' });

    const updated = db.prepare('SELECT * FROM remediations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update remediation: ' + err.message });
  }
});

export default router;
