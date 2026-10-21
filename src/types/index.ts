export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type FindingStatus =
  | 'Not Started'
  | 'Planned'
  | 'In Progress'
  | 'Verified Vulnerable'
  | 'Not Reproduced'
  | 'Mitigated'
  | 'Retested'
  | 'Closed';

export type EvidenceType =
  | 'Screenshot'
  | 'HTTP Request'
  | 'HTTP Response'
  | 'Browser Console'
  | 'Tool Output'
  | 'Configuration Evidence'
  | 'Remediation Evidence'
  | 'Retest Evidence';

export type RetestOutcome =
  | 'Not Retested'
  | 'Retest Failed'
  | 'Fix Verified'
  | 'Partially Mitigated'
  | 'Unable to Verify'
  | 'Not Applicable';

export interface Finding {
  id: string;
  title: string;
  slug: string;
  category: string;
  owasp_edition: string;
  owasp_id: string;
  severity: Severity;
  cvss_score: number | null;
  cvss_vector: string | null;
  status: FindingStatus;
  affected_component: string | null;
  target_endpoint: string | null;
  target_method: string | null;
  hypothesis: string | null;
  prerequisites: string | null;
  reproduction_steps: string | null;
  expected_behavior: string | null;
  observed_behavior: string | null;
  impact: string | null;
  remediation_summary: string | null;
  vulnerable_code_example: string | null;
  secure_code_example: string | null;
  references_list: string[];
  is_seed_template: number;
  evidence_count?: number;
  retest_count?: number;
  evidence?: Evidence[];
  assessments?: Assessment[];
  remediation?: Remediation | null;
  retests?: Retest[];
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  finding_id: string;
  target_version: string;
  test_environment: string;
  methodology: string;
  outcome: 'Verified Vulnerable' | 'Not Reproduced' | 'Partially Vulnerable' | 'Untested Template';
  observations: string | null;
  tested_at: string;
}

export interface Evidence {
  id: string;
  finding_id: string;
  assessment_id: string | null;
  title: string;
  filename: string | null;
  original_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  evidence_type: EvidenceType;
  description: string | null;
  redaction_status: 'Redacted' | 'Unredacted' | 'N/A';
  test_stage: string;
  http_method: string | null;
  http_path: string | null;
  http_headers: string | null;
  http_body: string | null;
  http_status: number | null;
  http_response_headers: string | null;
  http_response_body: string | null;
  captured_at: string;
}

export interface Remediation {
  id: string;
  finding_id: string;
  finding_title?: string;
  category?: string;
  severity?: Severity;
  root_cause: string;
  recommended_fix: string;
  implementation_status: 'Drafted' | 'Example Built' | 'Applied to Companion' | 'Pending Retest' | 'Verified';
  secure_pattern: string | null;
  vulnerable_pattern: string | null;
  verification_notes: string | null;
  remaining_limitations: string | null;
  updated_at: string;
}

export interface Retest {
  id: string;
  finding_id: string;
  finding_title?: string;
  category?: string;
  severity?: Severity;
  remediation_id: string | null;
  target_tested: string;
  test_methodology: string;
  expected_result: string;
  actual_result: string;
  outcome: RetestOutcome;
  notes: string | null;
  retested_at: string;
}

export interface TargetHealth {
  status: 'connected' | 'disconnected' | 'unconfigured' | 'error';
  target_url: string | null;
  status_code?: number;
  status_text?: string;
  latency_ms?: number;
  server_header?: string;
  error_message?: string;
  checked_at: string;
  message: string;
}

export interface DashboardStats {
  totalFindings: number;
  plannedTests: number;
  inProgressTests: number;
  verifiedVulnerable: number;
  notReproduced: number;
  mitigatedFindings: number;
  retestedFindings: number;
  awaitingRetest: number;
  evidenceCount: number;
  bySeverity: { severity: Severity; count: number }[];
  byCategory: { category: string; count: number }[];
  byStatus: { status: FindingStatus; count: number }[];
}

export interface LabSettings {
  [key: string]: string;
}
