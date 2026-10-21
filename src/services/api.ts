import {
  Finding, FindingStatus, Severity, DashboardStats,
  Evidence, Remediation, Retest, TargetHealth, LabSettings, Assessment
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Stats & Health
  getStats: () => fetch(`${BASE_URL}/findings/stats`).then(r => handleResponse<DashboardStats>(r)),
  getTargetHealth: () => fetch(`${BASE_URL}/health/target`).then(r => handleResponse<TargetHealth>(r)),
  getSystemHealth: () => fetch(`${BASE_URL}/health/system`).then(r => handleResponse<any>(r)),

  // Findings
  getFindings: (params?: { category?: string; severity?: Severity; status?: FindingStatus; search?: string; sort?: string; order?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.order) query.append('order', params.order);
    return fetch(`${BASE_URL}/findings?${query.toString()}`).then(r => handleResponse<Finding[]>(r));
  },
  getFinding: (id: string) => fetch(`${BASE_URL}/findings/${id}`).then(r => handleResponse<Finding>(r)),
  updateFinding: (id: string, data: Partial<Finding>) =>
    fetch(`${BASE_URL}/findings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Finding>(r)),
  createFinding: (data: Partial<Finding>) =>
    fetch(`${BASE_URL}/findings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Finding>(r)),

  // Assessments
  getAssessments: (findingId?: string) => {
    const q = findingId ? `?finding_id=${findingId}` : '';
    return fetch(`${BASE_URL}/assessments${q}`).then(r => handleResponse<Assessment[]>(r));
  },
  recordAssessment: (data: {
    finding_id: string;
    target_version: string;
    test_environment: string;
    methodology: string;
    outcome: string;
    observations?: string;
    update_finding_status?: boolean;
  }) =>
    fetch(`${BASE_URL}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Assessment>(r)),

  // Evidence
  getEvidence: (findingId?: string, evidenceType?: string) => {
    const query = new URLSearchParams();
    if (findingId) query.append('finding_id', findingId);
    if (evidenceType) query.append('evidence_type', evidenceType);
    return fetch(`${BASE_URL}/evidence?${query.toString()}`).then(r => handleResponse<Evidence[]>(r));
  },
  createHttpEvidence: (data: Partial<Evidence>) =>
    fetch(`${BASE_URL}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Evidence>(r)),
  uploadEvidenceFile: (formData: FormData) =>
    fetch(`${BASE_URL}/evidence/upload`, {
      method: 'POST',
      body: formData
    }).then(r => handleResponse<Evidence>(r)),
  deleteEvidence: (id: string) =>
    fetch(`${BASE_URL}/evidence/${id}`, {
      method: 'DELETE'
    }).then(r => handleResponse<{ success: boolean; message: string }>(r)),

  // Remediations
  getRemediations: () => fetch(`${BASE_URL}/remediation`).then(r => handleResponse<Remediation[]>(r)),
  getRemediation: (findingId: string) => fetch(`${BASE_URL}/remediation/${findingId}`).then(r => handleResponse<Remediation>(r)),
  updateRemediation: (id: string, data: Partial<Remediation>) =>
    fetch(`${BASE_URL}/remediation/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Remediation>(r)),

  // Retests
  getRetests: (findingId?: string) => {
    const q = findingId ? `?finding_id=${findingId}` : '';
    return fetch(`${BASE_URL}/retesting${q}`).then(r => handleResponse<Retest[]>(r));
  },
  recordRetest: (data: {
    finding_id: string;
    remediation_id?: string | null;
    target_tested: string;
    test_methodology: string;
    expected_result: string;
    actual_result: string;
    outcome: string;
    notes?: string;
    update_finding_status?: boolean;
  }) =>
    fetch(`${BASE_URL}/retesting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<Retest>(r)),

  // Reports & Settings
  getFullReport: () => fetch(`${BASE_URL}/reports/full`).then(r => handleResponse<any>(r)),
  getSettings: () => fetch(`${BASE_URL}/settings`).then(r => handleResponse<LabSettings>(r)),
  updateSettings: (settings: Partial<LabSettings>) =>
    fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }).then(r => handleResponse<LabSettings>(r)),
  resetDatabase: () =>
    fetch(`${BASE_URL}/settings/reset`, {
      method: 'POST'
    }).then(r => handleResponse<{ success: boolean; message: string }>(r)),

  // Companion Endpoints
  getCompanionInfo: () => fetch(`${BASE_URL}/companion/info`).then(r => handleResponse<any>(r)),
  testCompanionEndpoint: async (mode: 'vulnerable' | 'patched', endpoint: string, options?: RequestInit) => {
    const url = `${BASE_URL}/companion/${mode}${endpoint}`;
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let body: any;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body
    };
  }
};
