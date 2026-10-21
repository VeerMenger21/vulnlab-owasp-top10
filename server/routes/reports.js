import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/reports/full - Complete academic report data
router.get('/full', (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of settingsRows) settings[r.key] = r.value;

    const findings = db.prepare('SELECT * FROM findings ORDER BY id ASC').all();
    const findingsWithDetails = findings.map(f => {
      const evidence = db.prepare('SELECT * FROM evidence WHERE finding_id = ?').all(f.id);
      const remediation = db.prepare('SELECT * FROM remediations WHERE finding_id = ?').get(f.id);
      const retests = db.prepare('SELECT * FROM retests WHERE finding_id = ?').all(f.id);
      return {
        ...f,
        references_list: f.references_list ? JSON.parse(f.references_list) : [],
        evidence,
        remediation: remediation || null,
        retests
      };
    });

    const stats = {
      total: findings.length,
      verified: findings.filter(f => f.status === 'Verified Vulnerable').length,
      mitigated: findings.filter(f => ['Mitigated', 'Retested', 'Closed'].includes(f.status)).length,
      planned: findings.filter(f => f.status === 'Planned').length,
      evidenceTotal: db.prepare('SELECT COUNT(*) as c FROM evidence').get().c,
      retestsVerified: db.prepare("SELECT COUNT(*) as c FROM retests WHERE outcome = 'Fix Verified'").get().c
    };

    res.json({
      generated_at: new Date().toISOString(),
      project_title: 'Exploiting and Mitigating OWASP Top 10 Vulnerabilities in OWASP Juice Shop',
      settings,
      stats,
      findings: findingsWithDetails
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compile report: ' + err.message });
  }
});

// GET /api/reports/markdown - Export full academic report as clean Markdown
router.get('/markdown', (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of settingsRows) settings[r.key] = r.value;

    const findings = db.prepare('SELECT * FROM findings ORDER BY id ASC').all();

    let md = `# Exploiting and Mitigating OWASP Top 10 Vulnerabilities in OWASP Juice Shop\n`;
    md += `## Academic Cybersecurity Capstone Assessment Report\n\n`;
    md += `**Candidate:** ${settings.student_name || 'Undergraduate Engineering Candidate'}  \n`;
    md += `**Roll Number:** ${settings.roll_number || 'N/A'}  \n`;
    md += `**Department:** ${settings.college_name || 'Department of Computer Engineering'}  \n`;
    md += `**Faculty Guide:** ${settings.guide_name || 'Cybersecurity Faculty Advisor'}  \n`;
    md += `**Target System:** ${settings.target_name || 'OWASP Juice Shop'} (${settings.target_url || 'http://127.0.0.1:3000'})  \n`;
    md += `**Assessment Date:** ${new Date().toLocaleDateString()}  \n\n`;

    md += `---\n\n`;
    md += `### 1. Executive Summary & Assessment Scope\n\n`;
    md += `This academic project conducts an empirical security assessment of modern web application vulnerabilities using OWASP Juice Shop as an authorized, isolated local testbed. Vulnerabilities across OWASP Top 10:2021 categories were investigated, documented with technical request/response evidence, mitigated through secure coding patterns, and systematically retested.\n\n`;

    md += `### 2. Summary of Findings\n\n`;
    md += `| Finding ID | Title | OWASP Category | Severity | Current Status |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    for (const f of findings) {
      md += `| **${f.id}** | ${f.title} | ${f.category} | ${f.severity} | ${f.status} |\n`;
    }

    md += `\n---\n\n`;
    md += `### 3. Detailed Technical Findings & Remediation Analysis\n\n`;

    for (const f of findings) {
      const evidence = db.prepare('SELECT * FROM evidence WHERE finding_id = ?').all(f.id);
      const remediation = db.prepare('SELECT * FROM remediations WHERE finding_id = ?').get(f.id);
      const retests = db.prepare('SELECT * FROM retests WHERE finding_id = ?').all(f.id);

      md += `#### ${f.id}: ${f.title}\n\n`;
      md += `- **OWASP Classification:** ${f.category} (${f.owasp_edition})\n`;
      md += `- **Severity Rating:** ${f.severity} (CVSS: ${f.cvss_score || 'N/A'})\n`;
      md += `- **Affected Endpoint:** \`${f.target_method || 'GET'} ${f.target_endpoint || f.affected_component}\`\n`;
      md += `- **Assessment Status:** \`${f.status}\`\n\n`;

      md += `**Security Hypothesis:**  \n${f.hypothesis || 'N/A'}\n\n`;
      md += `**Reproduction Methodology:**  \n${f.reproduction_steps || 'N/A'}\n\n`;
      md += `**Observed Behavior:**  \n${f.observed_behavior || 'Awaiting lab execution.'}\n\n`;
      md += `**Security Impact:**  \n${f.impact || 'N/A'}\n\n`;

      if (remediation) {
        md += `**Root Cause:**  \n${remediation.root_cause}\n\n`;
        md += `**Remediation Recommendation:**  \n${remediation.recommended_fix}\n\n`;
        if (f.vulnerable_code_example) {
          md += `**Vulnerable Implementation:**\n\`\`\`javascript\n${f.vulnerable_code_example}\n\`\`\`\n\n`;
        }
        if (f.secure_code_example) {
          md += `**Secure Remediation Implementation:**\n\`\`\`javascript\n${f.secure_code_example}\n\`\`\`\n\n`;
        }
      }

      if (retests.length > 0) {
        md += `**Verification & Retest Results:**\n`;
        for (const r of retests) {
          md += `- Target: *${r.target_tested}* | Outcome: **${r.outcome}** (${new Date(r.retested_at).toLocaleDateString()})\n  Actual Result: ${r.actual_result}\n`;
        }
        md += `\n`;
      }

      if (evidence.length > 0) {
        md += `**Recorded Evidence Artifacts:**\n`;
        for (const e of evidence) {
          md += `- [${e.id}] **${e.title}** (${e.evidence_type}) - Stage: ${e.test_stage} - Redaction: ${e.redaction_status}\n`;
        }
        md += `\n`;
      }

      md += `---\n\n`;
    }

    res.set('Content-Type', 'text/markdown');
    res.set('Content-Disposition', 'attachment; filename="OWASP-JuiceShop-Security-Report.md"');
    res.send(md);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export markdown report: ' + err.message });
  }
});

export default router;
