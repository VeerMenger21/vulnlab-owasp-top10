import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'vulnlab.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for robust concurrent access
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      owasp_edition TEXT NOT NULL DEFAULT 'OWASP Top 10:2021',
      owasp_id TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('Critical', 'High', 'Medium', 'Low', 'Informational')),
      cvss_score REAL,
      cvss_vector TEXT,
      status TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Not Started', 'Planned', 'In Progress', 'Verified Vulnerable', 'Not Reproduced', 'Mitigated', 'Retested', 'Closed')),
      affected_component TEXT,
      target_endpoint TEXT,
      target_method TEXT DEFAULT 'GET',
      hypothesis TEXT,
      prerequisites TEXT,
      reproduction_steps TEXT,
      expected_behavior TEXT,
      observed_behavior TEXT,
      impact TEXT,
      remediation_summary TEXT,
      secure_code_example TEXT,
      vulnerable_code_example TEXT,
      references_list TEXT,
      is_seed_template INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      target_version TEXT NOT NULL,
      test_environment TEXT NOT NULL,
      methodology TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK(outcome IN ('Verified Vulnerable', 'Not Reproduced', 'Partially Vulnerable', 'Untested Template')),
      observations TEXT,
      tested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      assessment_id TEXT,
      title TEXT NOT NULL,
      filename TEXT,
      original_name TEXT,
      mime_type TEXT,
      file_size INTEGER,
      evidence_type TEXT NOT NULL CHECK(evidence_type IN ('Screenshot', 'HTTP Request', 'HTTP Response', 'Browser Console', 'Tool Output', 'Configuration Evidence', 'Remediation Evidence', 'Retest Evidence')),
      description TEXT,
      redaction_status TEXT NOT NULL DEFAULT 'Redacted' CHECK(redaction_status IN ('Redacted', 'Unredacted', 'N/A')),
      test_stage TEXT DEFAULT 'Vulnerability Verification',
      http_method TEXT,
      http_path TEXT,
      http_headers TEXT,
      http_body TEXT,
      http_status INTEGER,
      http_response_headers TEXT,
      http_response_body TEXT,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS remediations (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL UNIQUE,
      root_cause TEXT NOT NULL,
      recommended_fix TEXT NOT NULL,
      implementation_status TEXT NOT NULL DEFAULT 'Drafted' CHECK(implementation_status IN ('Drafted', 'Example Built', 'Applied to Companion', 'Pending Retest', 'Verified')),
      secure_pattern TEXT,
      vulnerable_pattern TEXT,
      verification_notes TEXT,
      remaining_limitations TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS retests (
      id TEXT PRIMARY KEY,
      finding_id TEXT NOT NULL,
      remediation_id TEXT,
      target_tested TEXT NOT NULL,
      test_methodology TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      actual_result TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK(outcome IN ('Not Retested', 'Retest Failed', 'Fix Verified', 'Partially Mitigated', 'Unable to Verify', 'Not Applicable')),
      notes TEXT,
      retested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
    CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
    CREATE INDEX IF NOT EXISTS idx_evidence_finding ON evidence(finding_id);
    CREATE INDEX IF NOT EXISTS idx_retests_finding ON retests(finding_id);
  `);

  // Initialize default lab settings if not existing
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  stmt.run('target_url', 'http://127.0.0.1:3000');
  stmt.run('target_name', 'OWASP Juice Shop');
  stmt.run('target_version', 'v16.0.0 (Official Docker Image)');
  stmt.run('companion_url', 'http://127.0.0.1:5000/api/companion');
  stmt.run('student_name', 'Undergraduate Engineering Candidate');
  stmt.run('roll_number', 'CS-CYBER-2026-001');
  stmt.run('guide_name', 'Senior Cyber Security Faculty Advisor');
  stmt.run('college_name', 'Department of Computer Engineering');
  stmt.run('academic_year', '2025 - 2026');
}

export default db;
