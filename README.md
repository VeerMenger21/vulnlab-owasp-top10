# VulnLab: OWASP Top 10 Assessment & Remediation Platform
### Exploiting and Mitigating OWASP Top 10 Vulnerabilities in OWASP Juice Shop
*Full-stack cyber assessment platform, forensic evidence logger, and verified remediation testbed.*


[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24-brightgreen.svg)](https://nodejs.org)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%20%2B%20TS-blue.svg)](https://vitejs.dev)
[![OWASP Top 10](https://img.shields.io/badge/Standard-OWASP%20Top%2010%3A2021-orange.svg)](https://owasp.org/Top10/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An academic cybersecurity project demonstrating practical security testing, controlled vulnerability exploitation, evidence collection, and defensive mitigation verification using **OWASP Juice Shop** as an authorized local testbed.

---

## 1. Project Overview

Modern web applications are susceptible to critical security flaws arising from unsafe input concatenation, flawed authorization logic, and default configurations. This project couples an isolated target environment with a full-stack **VulnLab Assessment Portal** that enables students and evaluators to:

1. **Target:** Run OWASP Juice Shop containerized in Docker on `http://127.0.0.1:3000`.
2. **Assess:** Investigate core vulnerabilities across the OWASP Top 10:2021 framework.
3. **Inspect:** Capture and log raw HTTP request/response transcripts using Burp Suite or browser tools.
4. **Redact:** Automatically mask sensitive session tokens, passwords, and secrets.
5. **Remediate:** Compare vulnerable code patterns with secure, parameterized implementations.
6. **Verify:** Perform live side-by-side verification tests against an integrated Companion Patched Testbed.
7. **Report:** Generate formal academic reports (PDF and Markdown) with university authorship metadata.

---

## 2. System Architecture

The project is structured into two clearly decoupled components:

- **Component A: Target Application (Port 3000)**  
  Containerized official OWASP Juice Shop (`bkimminich/juice-shop:v16.0.0`) bound strictly to `127.0.0.1:3000`.
- **Component B: VulnLab Assessment Portal (Port 5000 / 5173)**  
  - **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide icons, Vite.
  - **Backend:** Node.js Express server with SQLite (`better-sqlite3` in WAL mode).
  - **Companion Service:** An in-process testbed (`/api/companion`) hosting vulnerable vs patched endpoints for empirical verification.

---

## 3. Targeted Vulnerabilities & OWASP Mapping

| Finding ID | Vulnerability Title | OWASP:2021 Category | Severity | CVSS v3.1 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FIND-01** | SQL Injection Authentication Bypass | A03: Injection | Critical | 9.8 | Retested / Verified |
| **FIND-02** | Broken Access Control: Admin Route | A01: Broken Access Control | High | 8.6 | Retested / Verified |
| **FIND-03** | Insecure Direct Object Reference (IDOR) | A01: Broken Access Control | High | 7.5 | Retested / Verified |
| **FIND-04** | Cross-Site Scripting (XSS) in Search | A03: Injection | Medium | 6.1 | Retested / Verified |
| **FIND-05** | Sensitive Data Exposure in User APIs | A02: Cryptographic Failures | High | 7.5 | Retested / Verified |
| **FIND-06** | Security Misconfiguration: Headers | A05: Security Misconfiguration | Medium | 5.3 | Retested / Verified |

---

## 4. Quick Start & Installation

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-username/owasp-juice-shop-security-lab.git
cd owasp-juice-shop-security-lab
npm install
```

### Step 2: Start Target Application (Docker)
Ensure Docker Desktop is running, then execute:
```bash
docker compose up -d
```
Verify container health:
```bash
docker compose ps
```
Juice Shop will be accessible at: `http://127.0.0.1:3000`

> **Note if Docker is unavailable:** The VulnLab Companion Testbed (`http://127.0.0.1:5000/api/companion`) provides complete in-memory vulnerable and patched endpoints for side-by-side evaluation without requiring Docker.

### Step 3: Launch VulnLab Assessment Portal
```bash
npm run dev
```
Open your browser and navigate to:
```text
http://127.0.0.1:5173
```

---

## 5. Demonstration Workflow

1. **Overview Dashboard:** Verify real-time target connectivity and assessment metrics.
2. **Vulnerability Catalog:** Search and filter vulnerabilities by OWASP category and severity.
3. **Assessment Workspace:** Review hypotheses, launch target endpoints, and capture HTTP transcripts with automated token redaction.
4. **Evidence Repository:** Inspect captured screenshots and HTTP logs in a safe preview modal.
5. **Remediation Center:** Review root causes and run live side-by-side tests in the Companion Testbed to prove that the patched logic neutralizes the attack.
6. **Retesting & Verification:** Log verified regression tests and promote finding status.
7. **Final Academic Report:** Review the complete 23-section report, export Markdown, or print directly to PDF.

---

## 6. Academic Documentation Index

All formal university project documentation is organized in the `docs/` directory:

- [Project Report (23 Sections)](docs/PROJECT_REPORT.md)
- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Structured Test Plan Matrix](docs/TEST_PLAN.md)
- [OWASP Top 10 Taxonomy & Mapping](docs/OWASP_MAPPING.md)
- [Vulnerability Remediation Guide](docs/REMEDIATION_GUIDE.md)
- [University Viva Demonstration Script](docs/DEMO_SCRIPT.md)
- [30+ Viva Voce Questions & Answers](docs/VIVA_QUESTIONS.md)
- [Installation & Testing Tools Guide](docs/INSTALLATION_GUIDE.md)
- [Evidence Directory Layout](docs/evidence/README.md)

---

## 7. Security & Ethics Disclaimer

> [!IMPORTANT]
> This laboratory application and associated testbeds are developed solely for authorized educational and academic research purposes within an accredited Computer Engineering program. All testing must be confined strictly to authorized localhost loopback interfaces (`127.0.0.1`). The tools, techniques, and payloads must never be used against unauthorized external systems or production networks.
>>>>>>> e5299e6 (feat: complete academic cybersecurity project for OWASP Top 10 in OWASP Juice Shop)
