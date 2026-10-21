import React from 'react';
import { PageId } from '../components/Layout';
import { BookOpen, ExternalLink, ShieldCheck, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const OwaspMappingPage: React.FC<Props> = ({ onNavigate }) => {
  const owaspCategories = [
    {
      id: 'A01:2021',
      title: 'Broken Access Control',
      rank: 1,
      cweCount: 34,
      description: 'Failures to enforce restrictions on what authenticated or anonymous users are allowed to do. Flaws lead to unauthorized information disclosure, modification, or destruction of data, or performing a business function outside the user’s limits.',
      investigatedFindings: [
        { id: 'FIND-02', title: 'Unprotected Administrative Routing (/administration)', verified: true },
        { id: 'FIND-03', title: 'Insecure Direct Object Reference (IDOR) in Basket Lookup (/rest/basket/:id)', verified: true }
      ],
      mitigationPattern: 'Enforce server-side authorization on every endpoint using role-based or attribute-based access control. Cross-reference resource ownership against caller JWT context. Deny by default.',
      officialUrl: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/'
    },
    {
      id: 'A02:2021',
      title: 'Cryptographic Failures',
      rank: 2,
      cweCount: 29,
      description: 'Formerly known as Sensitive Data Exposure. Focuses on failures related to cryptography (or lack thereof), which often lead to sensitive data exposure or system compromise (e.g., transmitting credentials in plaintext, weak hashing).',
      investigatedFindings: [
        { id: 'FIND-05', title: 'Sensitive Data Exposure: Password Hashes & Secrets in Public User API (/api/Users)', verified: true }
      ],
      mitigationPattern: 'Classify data processed, stored, or transmitted. Encrypt all sensitive data in transit using TLS 1.3 and at rest with robust algorithms (AES-GCM). Apply Data Transfer Object (DTO) projection to strip passwords.',
      officialUrl: 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/'
    },
    {
      id: 'A03:2021',
      title: 'Injection',
      rank: 3,
      cweCount: 33,
      description: 'Occurs when user-supplied data is not validated, filtered, or sanitized by the application before being interpreted by a parser or interpreter (SQL, NoSQL, OS commands, LDAP, XSS).',
      investigatedFindings: [
        { id: 'FIND-01', title: 'SQL Injection in User Authentication Endpoint (/rest/user/login)', verified: true },
        { id: 'FIND-04', title: 'Cross-Site Scripting (DOM-based & Reflected) in Product Search (/search?q=...)', verified: true }
      ],
      mitigationPattern: 'Always use safe APIs such as parameterized queries (prepared statements) for SQL, context-appropriate HTML entity encoding for DOM rendering, and strict input allow-lists.',
      officialUrl: 'https://owasp.org/Top10/A03_2021-Injection/'
    },
    {
      id: 'A04:2021',
      title: 'Insecure Design',
      rank: 4,
      cweCount: 40,
      description: 'A category focusing on risks related to design and architectural flaws. A secure design cannot be achieved simply by adding security controls to an insecurely designed architecture (e.g. lack of business-logic threat modeling).',
      investigatedFindings: [],
      mitigationPattern: 'Establish a secure development lifecycle with AppSec professionals. Use threat modeling for critical authentication, access control, and business logic flows.',
      officialUrl: 'https://owasp.org/Top10/A04_2021-Insecure_Design/'
    },
    {
      id: 'A05:2021',
      title: 'Security Misconfiguration',
      rank: 5,
      cweCount: 20,
      description: 'Insecure default configurations, incomplete or ad-hoc configurations, open cloud storage, misconfigured HTTP headers, and verbose error messages containing sensitive information.',
      investigatedFindings: [
        { id: 'FIND-06', title: 'Exposed Swagger/API Docs, Verbose Stack Traces & Missing Security Headers', verified: true }
      ],
      mitigationPattern: 'A repeatable hardening process that makes it fast and easy to deploy another environment that is properly locked down. Remove unused features, frameworks, and endpoints. Deploy Helmet and enforce defensive headers.',
      officialUrl: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/'
    },
    {
      id: 'A06:2021',
      title: 'Vulnerable and Outdated Components',
      rank: 6,
      cweCount: 3,
      description: 'Components such as libraries, frameworks, and other software modules run with the same privileges as the application. If a vulnerable component is exploited, such an attack can facilitate serious data loss or server takeover.',
      investigatedFindings: [],
      mitigationPattern: 'Remove unused dependencies, unnecessary features, components, files, and documentation. Continuously inventory client-side and server-side components and their dependencies using tools like npm audit or Snyk.',
      officialUrl: 'https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/'
    },
    {
      id: 'A07:2021',
      title: 'Identification and Authentication Failures',
      rank: 7,
      cweCount: 22,
      description: 'Confirmation of the user\'s identity, authentication, and session management is critical to protect against authentication-related attacks (e.g. credential stuffing, weak password reset tokens, lack of multi-factor authentication).',
      investigatedFindings: [],
      mitigationPattern: 'Implement multi-factor authentication (MFA), do not ship default credentials, enforce password strength checks, align password recovery with modern NIST guidelines.',
      officialUrl: 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/'
    },
    {
      id: 'A08:2021',
      title: 'Software and Data Integrity Failures',
      rank: 8,
      cweCount: 10,
      description: 'Relates to code and infrastructure that does not protect against integrity violations (e.g., untrusted CDN scripts, unverified CI/CD pipelines, and insecure deserialization).',
      investigatedFindings: [],
      mitigationPattern: 'Use digital signatures or similar mechanisms to verify that software or data is from the expected source and has not been altered. Ensure libraries come from trusted repositories with Subresource Integrity (SRI).',
      officialUrl: 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/'
    },
    {
      id: 'A09:2021',
      title: 'Security Logging and Monitoring Failures',
      rank: 9,
      cweCount: 4,
      description: 'Insufficient logging, detection, monitoring, and active response can result in attackers maintaining persistence, pivoting to more systems, and tampering, extracting, or destroying data without detection.',
      investigatedFindings: [],
      mitigationPattern: 'Ensure all login, access control, and server-side input validation failures can be logged with sufficient user context to identify suspicious or malicious accounts. Forward logs to a SIEM.',
      officialUrl: 'https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/'
    },
    {
      id: 'A10:2021',
      title: 'Server-Side Request Forgery (SSRF)',
      rank: 10,
      cweCount: 1,
      description: 'Occurs when a web application fetches a remote resource without validating the user-supplied URL. An attacker can coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall or VPN.',
      investigatedFindings: [],
      mitigationPattern: 'Sanitize and filter all client-supplied input data. Isolate the resource fetching module in a separate network. Enforce URL allow-lists and disable HTTP redirections.',
      officialUrl: 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span>OWASP Top 10 Taxonomy & Project Classification Mapping</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive reference mapping based on the official OWASP Top 10:2021 baseline standard
        </p>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 flex items-start space-x-3 text-xs text-slate-300">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="leading-relaxed">
            <strong className="text-white">Taxonomy Disclaimer:</strong> The complete OWASP Top 10:2021 categories (A01 through A10) are presented below as an academic reference standard. A representative selection of categories (A01, A02, A03, A05) has been specifically targeted, investigated, and verified in the Juice Shop laboratory environment. Categories without tested findings are planned objectives and are not falsely claimed as exploited.
          </p>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {owaspCategories.map((cat) => {
          const hasFindings = cat.investigatedFindings.length > 0;
          return (
            <div
              key={cat.id}
              className={`p-5 rounded-xl border transition-all ${
                hasFindings
                  ? 'border-cyan-500/30 bg-lab-900 shadow-md'
                  : 'border-lab-800 bg-lab-900/60 opacity-90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lab-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-lab-950 border border-lab-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                    #{cat.rank}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">{cat.id}</span>
                      <span className="text-sm font-bold text-white">{cat.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    hasFindings
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-700/20 text-slate-400 border-slate-700'
                  }`}>
                    {hasFindings ? `${cat.investigatedFindings.length} Lab Objectives Active` : 'Planned / Untested'}
                  </span>
                  <a
                    href={cat.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                    title="Open official OWASP documentation"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="pt-3 space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed">{cat.description}</p>

                {/* Investigated Findings in this category */}
                {hasFindings && (
                  <div className="p-3 bg-lab-950 rounded-lg border border-lab-800 space-y-2">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                      Targeted Laboratory Findings in Project:
                    </span>
                    <div className="space-y-1.5">
                      {cat.investigatedFindings.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => onNavigate('finding-detail', f.id)}
                          className="flex items-center justify-between p-2 rounded bg-lab-900 hover:bg-lab-850 border border-lab-800 cursor-pointer group transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-cyan-400">{f.id}</span>
                            <span className="text-slate-200 group-hover:text-cyan-300 font-medium">
                              {f.title}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-lab-950/60 rounded border border-lab-800/80 text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 font-semibold">Standard Defensive Strategy: </strong>
                  {cat.mitigationPattern}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
