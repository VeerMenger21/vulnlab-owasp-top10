import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/findings/stats - Calculated dynamically from database
router.get('/stats', (req, res) => {
  try {
    const totalFindings = db.prepare('SELECT COUNT(*) as count FROM findings').get().count;
    const plannedTests = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Planned'").get().count;
    const inProgressTests = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'In Progress'").get().count;
    const verifiedVulnerable = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Verified Vulnerable'").get().count;
    const notReproduced = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Not Reproduced'").get().count;
    const mitigatedFindings = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status IN ('Mitigated', 'Retested', 'Closed')").get().count;
    const retestedFindings = db.prepare("SELECT COUNT(*) as count FROM retests WHERE outcome = 'Fix Verified'").get().count;
    const awaitingRetest = db.prepare("SELECT COUNT(*) as count FROM findings WHERE status = 'Mitigated'").get().count;
    const evidenceCount = db.prepare('SELECT COUNT(*) as count FROM evidence').get().count;

    const bySeverity = db.prepare('SELECT severity, COUNT(*) as count FROM findings GROUP BY severity').all();
    const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM findings GROUP BY category').all();
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM findings GROUP BY status').all();

    res.json({
      totalFindings,
      plannedTests,
      inProgressTests,
      verifiedVulnerable,
      notReproduced,
      mitigatedFindings,
      retestedFindings,
      awaitingRetest,
      evidenceCount,
      bySeverity,
      byCategory,
      byStatus
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve assessment stats: ' + err.message });
  }
});

// GET /api/findings - List findings with filters, search, and sorting
router.get('/', (req, res) => {
  try {
    const { category, severity, status, search, sort = 'id', order = 'ASC' } = req.query;

    let query = 'SELECT * FROM findings WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (title LIKE ? OR id LIKE ? OR category LIKE ? OR affected_component LIKE ? OR description LIKE ? OR hypothesis LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    const allowedSortFields = ['id', 'title', 'severity', 'status', 'created_at', 'updated_at', 'cvss_score'];
    const sortField = allowedSortFields.includes(String(sort)) ? sort : 'id';
    const sortOrder = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    query += ` ORDER BY ${sortField} ${sortOrder}`;

    const findings = db.prepare(query).all(...params);

    // Attach evidence counts to each finding
    const findingsWithMeta = findings.map(f => {
      const evidenceCount = db.prepare('SELECT COUNT(*) as count FROM evidence WHERE finding_id = ?').get(f.id).count;
      const retestCount = db.prepare('SELECT COUNT(*) as count FROM retests WHERE finding_id = ?').get(f.id).count;
      return {
        ...f,
        evidence_count: evidenceCount,
        retest_count: retestCount,
        references_list: f.references_list ? JSON.parse(f.references_list) : []
      };
    });

    res.json(findingsWithMeta);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch findings: ' + err.message });
  }
});

// GET /api/findings/:id - Detailed finding with relations
router.get('/:id', (req, res) => {
  try {
    const finding = db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id);
    if (!finding) return res.status(404).json({ error: 'Finding not found' });

    const evidence = db.prepare('SELECT * FROM evidence WHERE finding_id = ? ORDER BY captured_at DESC').all(finding.id);
    const assessments = db.prepare('SELECT * FROM assessments WHERE finding_id = ? ORDER BY tested_at DESC').all(finding.id);
    const remediation = db.prepare('SELECT * FROM remediations WHERE finding_id = ?').get(finding.id);
    const retests = db.prepare('SELECT * FROM retests WHERE finding_id = ? ORDER BY retested_at DESC').all(finding.id);

    res.json({
      ...finding,
      references_list: finding.references_list ? JSON.parse(finding.references_list) : [],
      evidence,
      assessments,
      remediation: remediation || null,
      retests
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch finding details: ' + err.message });
  }
});

// PUT /api/findings/:id - Update finding details
router.put('/:id', (req, res) => {
  try {
    const {
      title, status, severity, cvss_score, cvss_vector,
      affected_component, target_endpoint, hypothesis, prerequisites,
      reproduction_steps, expected_behavior, observed_behavior, impact,
      remediation_summary, secure_code_example, vulnerable_code_example
    } = req.body;

    const stmt = db.prepare(`
      UPDATE findings SET
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        severity = COALESCE(?, severity),
        cvss_score = COALESCE(?, cvss_score),
        cvss_vector = COALESCE(?, cvss_vector),
        affected_component = COALESCE(?, affected_component),
        target_endpoint = COALESCE(?, target_endpoint),
        hypothesis = COALESCE(?, hypothesis),
        prerequisites = COALESCE(?, prerequisites),
        reproduction_steps = COALESCE(?, reproduction_steps),
        expected_behavior = COALESCE(?, expected_behavior),
        observed_behavior = COALESCE(?, observed_behavior),
        impact = COALESCE(?, impact),
        remediation_summary = COALESCE(?, remediation_summary),
        secure_code_example = COALESCE(?, secure_code_example),
        vulnerable_code_example = COALESCE(?, vulnerable_code_example),
        is_seed_template = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title, status, severity, cvss_score, cvss_vector,
      affected_component, target_endpoint, hypothesis, prerequisites,
      reproduction_steps, expected_behavior, observed_behavior, impact,
      remediation_summary, secure_code_example, vulnerable_code_example,
      req.params.id
    );

    if (result.changes === 0) return res.status(404).json({ error: 'Finding not found' });

    const updated = db.prepare('SELECT * FROM findings WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update finding: ' + err.message });
  }
});

// POST /api/findings - Add new custom finding
router.post('/', (req, res) => {
  try {
    const {
      id, title, category, owasp_id, severity, cvss_score, cvss_vector,
      status = 'Planned', affected_component, target_endpoint, target_method = 'GET',
      hypothesis, prerequisites, reproduction_steps, expected_behavior, observed_behavior,
      impact, remediation_summary, vulnerable_code_example, secure_code_example
    } = req.body;

    if (!id || !title || !category || !owasp_id || !severity) {
      return res.status(400).json({ error: 'Missing required fields: id, title, category, owasp_id, severity' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const stmt = db.prepare(`
      INSERT INTO findings (
        id, title, slug, category, owasp_edition, owasp_id, severity,
        cvss_score, cvss_vector, status, affected_component, target_endpoint,
        target_method, hypothesis, prerequisites, reproduction_steps,
        expected_behavior, observed_behavior, impact, remediation_summary,
        vulnerable_code_example, secure_code_example, references_list, is_seed_template
      ) VALUES (
        ?, ?, ?, ?, 'OWASP Top 10:2021', ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, '[]', 0
      )
    `);

    stmt.run(
      id, title, slug, category, owasp_id, severity,
      cvss_score || null, cvss_vector || null, status, affected_component || null, target_endpoint || null,
      target_method, hypothesis || null, prerequisites || null, reproduction_steps || null,
      expected_behavior || null, observed_behavior || null, impact || null, remediation_summary || null,
      vulnerable_code_example || null, secure_code_example || null
    );

    const created = db.prepare('SELECT * FROM findings WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create finding: ' + err.message });
  }
});

export default router;
