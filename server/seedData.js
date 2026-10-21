export const initialFindings = [
  {
    id: 'FIND-01',
    title: 'SQL Injection in User Authentication Endpoint',
    slug: 'sql-injection-authentication-bypass',
    category: 'A03:2021 — Injection',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A03:2021',
    severity: 'Critical',
    cvss_score: 9.8,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
    status: 'Planned',
    affected_component: 'User Login REST API (/rest/user/login)',
    target_endpoint: '/rest/user/login',
    target_method: 'POST',
    hypothesis: 'The authentication endpoint constructs an inline SQL query via raw string concatenation using the email input without proper parameter binding or sanitization, allowing an attacker to inject boolean logic (e.g., "\' OR 1=1--") to bypass credential validation.',
    prerequisites: '1. OWASP Juice Shop target running on http://127.0.0.1:3000\n2. Burp Suite or Browser DevTools Network Tab configured\n3. An active user table containing at least one administrative account (e.g. admin@juice-sh.op).',
    reproduction_steps: '1. Navigate to the Juice Shop login page at http://127.0.0.1:3000/#/login\n2. Enter the payload: \' OR 1=1-- in the Email field.\n3. Enter any arbitrary text (e.g., testpass) in the Password field.\n4. Intercept the POST /rest/user/login request using Burp Suite or browser network inspection.\n5. Observe whether the application authenticates the session as the administrator (admin@juice-sh.op) and returns a valid JWT authentication token.',
    expected_behavior: 'The server should query the database using parameterized prepared statements. Untrusted input must be treated strictly as literal data rather than executable SQL syntax. When no user matches the literal email "\' OR 1=1--", the server must reject the attempt with HTTP 401 Unauthorized.',
    observed_behavior: 'Awaiting lab execution: Expected that the concatenated query evaluates "WHERE email = \'\' OR 1=1--", returning the first database record (administrator) without validating the password.',
    impact: 'Complete authentication bypass, granting full unauthorized access to the highest-privileged administrative account, exposure of all customer personal records, and potential database takeover.',
    remediation_summary: 'Refactor SQL statement construction to use parameterized queries (prepared statements) provided by the ORM/database driver (Sequelize or SQLite). Never concatenate user-supplied input directly into SQL strings.',
    vulnerable_code_example: `// VULNERABLE: Direct SQL string concatenation
app.post('/rest/user/login', (req, res) => {
  const { email, password } = req.body;
  // Insecure raw query construction allowing boolean injection
  const query = "SELECT * FROM Users WHERE email = '" + email + "' AND password = '" + hash(password) + "';";
  
  db.all(query, (err, users) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (users.length > 0) {
      const token = generateJwt(users[0]);
      return res.json({ status: 'success', data: { user: users[0], token } });
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  });
});`,
    secure_code_example: `// SECURE: Parameterized query (Prepared Statement)
app.post('/rest/user/login', (req, res) => {
  const { email, password } = req.body;
  // Parameterized binding guarantees user input is treated strictly as data literals
  const query = "SELECT id, email, role, password_hash FROM Users WHERE email = ? LIMIT 1";
  
  db.get(query, [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    // Constant-time password verification using bcrypt / argon2
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateJwt({ id: user.id, email: user.email, role: user.role });
    return res.json({ status: 'success', data: { token } });
  });
});`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/89.html'
    ]),
    is_seed_template: 1
  },
  {
    id: 'FIND-02',
    title: 'Broken Access Control: Unprotected Administrative Routing and User Management',
    slug: 'broken-access-control-unprotected-admin',
    category: 'A01:2021 — Broken Access Control',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A01:2021',
    severity: 'High',
    cvss_score: 8.6,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L',
    status: 'Planned',
    affected_component: 'Administration Route (/administration) & API (/rest/admin/users)',
    target_endpoint: '/#/administration',
    target_method: 'GET',
    hypothesis: 'The frontend hides administrative navigation elements from regular users, but the backend API fails to enforce role-based access control (RBAC) checks on administrative endpoints, allowing unauthorized actors to perform administrative actions.',
    prerequisites: '1. Standard unprivileged user account or unauthenticated session\n2. Network client or web browser capable of requesting restricted URLs directly.',
    reproduction_steps: '1. Log in as an unprivileged customer account.\n2. Navigate directly to the client route http://127.0.0.1:3000/#/administration\n3. Inspect HTTP requests to backend REST endpoints such as /rest/admin/users or /api/Users\n4. Check if user listings, roles, or administrative functions are returned without validating the caller\'s role.',
    expected_behavior: 'The application must enforce server-side authorization checks on every sensitive endpoint. Unauthenticated or non-admin requests must be denied with HTTP 403 Forbidden or 401 Unauthorized.',
    observed_behavior: 'Awaiting lab execution: Client-side routing allows visiting the administrative interface and backend endpoints return data based solely on request presence rather than verified session role.',
    impact: 'Unauthorized privilege escalation, unauthorized deletion or alteration of user accounts, and exposure of user metadata.',
    remediation_summary: 'Implement server-side middleware that cryptographically validates the caller identity and asserts that req.user.role === "admin" before processing any administrative request.',
    vulnerable_code_example: `// VULNERABLE: Endpoint assumes caller is admin because UI only shows link to admins
app.get('/rest/admin/users', (req, res) => {
  // Missing role verification check!
  const users = db.prepare('SELECT id, email, role, created_at FROM Users').all();
  res.json({ status: 'success', data: users });
});`,
    secure_code_example: `// SECURE: Strict role-based authorization middleware
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Administrative privileges required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

app.get('/rest/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, role, created_at FROM Users').all();
  res.json({ status: 'success', data: users });
});`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/285.html'
    ]),
    is_seed_template: 1
  },
  {
    id: 'FIND-03',
    title: 'Insecure Direct Object Reference (IDOR) in Basket / Order Retrieval',
    slug: 'insecure-direct-object-reference-basket',
    category: 'A01:2021 — Broken Access Control',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A01:2021',
    severity: 'High',
    cvss_score: 7.5,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
    status: 'Planned',
    affected_component: 'Basket API Endpoint (/rest/basket/:id)',
    target_endpoint: '/rest/basket/2',
    target_method: 'GET',
    hypothesis: 'The basket lookup API relies entirely on a user-supplied numeric identifier in the URL path (or session cookie) and does not verify whether the requesting user actually owns the target basket.',
    prerequisites: '1. Two registered user accounts (User A with Basket ID 1, User B with Basket ID 2)\n2. Intercepting proxy (Burp Suite) or cURL with authentication headers.',
    reproduction_steps: '1. Authenticate as User A and observe that the application loads /rest/basket/1.\n2. In Burp Suite Repeater, modify the GET request path to /rest/basket/2.\n3. Send the modified request while keeping User A\'s session token.\n4. Check if the response returns the item contents, quantities, and pricing of User B\'s private cart.',
    expected_behavior: 'The application must cross-reference the requested basket record against the authenticated caller\'s user ID (req.user.id === basket.UserId). If ownership is not verified, return HTTP 403 Forbidden.',
    observed_behavior: 'Awaiting lab execution: Changing the resource ID parameter allows an arbitrary user to read or tamper with another customer\'s active shopping basket.',
    impact: 'Violation of customer data confidentiality, competitive intelligence disclosure, and unauthorized shopping cart tampering.',
    remediation_summary: 'Enforce object-level access control on the server by validating that the requested resource identifier belongs to the authenticated user ID extracted securely from the session token.',
    vulnerable_code_example: `// VULNERABLE: Direct access to database record using path parameter
app.get('/rest/basket/:id', (req, res) => {
  const basketId = req.params.id;
  // Insecure: Fetches record without checking if req.user owns this basketId!
  const basket = db.prepare('SELECT * FROM Baskets WHERE id = ?').get(basketId);
  if (!basket) return res.status(404).json({ error: 'Basket not found' });
  res.json({ status: 'success', data: basket });
});`,
    secure_code_example: `// SECURE: Object-level ownership validation
app.get('/rest/basket/:id', authenticateToken, (req, res) => {
  const basketId = req.params.id;
  const basket = db.prepare('SELECT * FROM Baskets WHERE id = ?').get(basketId);
  
  if (!basket) {
    return res.status(404).json({ error: 'Basket not found' });
  }
  
  // Enforce resource ownership policy
  if (basket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this basket' });
  }
  
  res.json({ status: 'success', data: basket });
});`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/639.html'
    ]),
    is_seed_template: 1
  },
  {
    id: 'FIND-04',
    title: 'Cross-Site Scripting (DOM-based & Reflected) in Product Search',
    slug: 'cross-site-scripting-product-search',
    category: 'A03:2021 — Injection',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A03:2021',
    severity: 'Medium',
    cvss_score: 6.1,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N',
    status: 'Planned',
    affected_component: 'Product Search Bar & Query Parameter (#/search?q=...)',
    target_endpoint: '/#/search?q=<iframe src="javascript:alert(`xss`)">',
    target_method: 'GET',
    hypothesis: 'The frontend application accepts user input from the search query parameter and inserts it into the Document Object Model (DOM) via an unsafe sink (such as innerHTML or bypassSecurityTrustHtml) without contextual HTML encoding.',
    prerequisites: '1. Standard modern web browser\n2. Target application running on http://127.0.0.1:3000',
    reproduction_steps: '1. Open the browser and visit: http://127.0.0.1:3000/#/search?q=<iframe src="javascript:alert(\`xss\`)">\n2. Observe if an alert dialog box executes in the browser viewport.\n3. Open Browser DevTools (F12) -> Elements tab.\n4. Inspect the rendered DOM container displaying the search term to verify unescaped tag insertion.',
    expected_behavior: 'The application must sanitize untrusted input or render it using safe text methods (such as textContent, innerText, or framework native data bindings) which automatically encode HTML control characters (&, <, >, ", \').',
    observed_behavior: 'Awaiting lab execution: The search term payload is written to the DOM as raw markup, resulting in JavaScript execution in the user\'s browser session.',
    impact: 'Execution of arbitrary client-side script in victim\'s browser context, potential session hijacking via document.cookie access (if HttpOnly is omitted), redirection to malicious phish sites, and DOM defacement.',
    remediation_summary: 'Render search strings using safe text nodes instead of raw HTML sinks. Implement context-aware output encoding and deploy a strict Content Security Policy (CSP) header.',
    vulnerable_code_example: `// VULNERABLE: Inserting unescaped user string into DOM innerHTML
function displaySearchResult(searchTerm) {
  const container = document.getElementById('search-query-display');
  // Unsafe DOM sink: executes any HTML tags or script attributes
  container.innerHTML = "Search results for: " + searchTerm;
}`,
    secure_code_example: `// SECURE: Using safe textContent or context-aware encoding
function displaySearchResult(searchTerm) {
  const container = document.getElementById('search-query-display');
  // Safe DOM property: browser treats content strictly as text literals
  container.textContent = "Search results for: " + searchTerm;
}

// In React: standard JSX expression automatically escapes values:
// <h2>Search results for: {searchTerm}</h2>`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
      'https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/79.html'
    ]),
    is_seed_template: 1
  },
  {
    id: 'FIND-05',
    title: 'Sensitive Data Exposure: Password Hashes & Secrets in Public API Responses',
    slug: 'sensitive-data-exposure-user-api',
    category: 'A02:2021 — Cryptographic Failures',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A02:2021',
    severity: 'High',
    cvss_score: 7.5,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    status: 'Planned',
    affected_component: 'User Query / Review Authors API (/api/Users, /rest/user/whoami)',
    target_endpoint: '/api/Users',
    target_method: 'GET',
    hypothesis: 'Database ORM queries return entire row entities including password hashes (MD5), salt values, TOTP secrets, or internal metadata, and the API serializes these entities directly to JSON without filtering.',
    prerequisites: '1. HTTP client or browser network tab\n2. Juice Shop target running on port 3000.',
    reproduction_steps: '1. Send a GET request to http://127.0.0.1:3000/api/Users using Burp Suite or browser.\n2. Inspect the JSON response body.\n3. Review the returned user object fields for password, totpSecret, salt, or resetToken attributes.',
    expected_behavior: 'APIs must follow data minimization principles. The backend should map internal database entities to clean Data Transfer Objects (DTOs) that omit sensitive credentials and secrets.',
    observed_behavior: 'Awaiting lab execution: Full user records containing hashed passwords and security tokens are transmitted in plaintext JSON to unauthenticated clients.',
    impact: 'Offline dictionary and rainbow table cracking against password hashes, leading to account compromise across the platform.',
    remediation_summary: 'Implement server-side projection and Data Transfer Object (DTO) filtering to explicitly select only non-sensitive public fields (e.g. id, username, profileImage).',
    vulnerable_code_example: `// VULNERABLE: Direct serialization of raw database entity
app.get('/api/Users', (req, res) => {
  // Queries all columns including password hashes and private keys
  const users = db.prepare('SELECT * FROM Users').all();
  res.json({ status: 'success', data: users });
});`,
    secure_code_example: `// SECURE: Explicit field projection and Data Transfer Object (DTO) mapping
app.get('/api/Users', (req, res) => {
  // Explicitly select only non-sensitive public attributes
  const query = 'SELECT id, username, email, created_at FROM Users';
  const safeUsers = db.prepare(query).all();
  
  res.json({
    status: 'success',
    data: safeUsers
  });
});`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/200.html'
    ]),
    is_seed_template: 1
  },
  {
    id: 'FIND-06',
    title: 'Security Misconfiguration: Exposed Debug Endpoints & Missing Security Headers',
    slug: 'security-misconfiguration-debug-headers',
    category: 'A05:2021 — Security Misconfiguration',
    owasp_edition: 'OWASP Top 10:2021',
    owasp_id: 'A05:2021',
    severity: 'Medium',
    cvss_score: 5.3,
    cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    status: 'Planned',
    affected_component: 'HTTP Server Headers, Swagger API Spec (/api-docs), Error Handling',
    target_endpoint: '/api-docs',
    target_method: 'GET',
    hypothesis: 'The application is deployed with default development settings, exposing interactive API documentation, leaking technology stack signatures in HTTP response headers (X-Powered-By: Express), and lacking defensive headers such as Content-Security-Policy and X-Frame-Options.',
    prerequisites: '1. Target application running on port 3000\n2. Curl or browser network tab for inspecting HTTP headers.',
    reproduction_steps: '1. Send a HEAD or GET request to http://127.0.0.1:3000/\n2. Inspect response headers for missing Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.\n3. Request Swagger/OpenAPI documentation at http://127.0.0.1:3000/api-docs\n4. Trigger an intentional 500 error to inspect whether full stack traces and directory paths are returned.',
    expected_behavior: 'Production deployments must disable debug documentation, strip server identifying headers, return generic error messages without stack traces, and enforce robust security headers.',
    observed_behavior: 'Awaiting lab execution: Interactive API schemas and framework fingerprints are publicly accessible; security headers are absent or incompletely configured.',
    impact: 'Aids attacker reconnaissance, facilitates Clickjacking attacks due to missing framing restrictions, and exposes internal source code architecture through stack traces.',
    remediation_summary: 'Employ Helmet middleware to set standard security headers, disable X-Powered-By, disable interactive API documentation in production environments, and handle errors generically.',
    vulnerable_code_example: `// VULNERABLE: Default Express setup with stack traces and exposed metadata
const express = require('express');
const app = express();

// Express reveals "X-Powered-By: Express" by default
// Debug documentation mounted unconditionally in production
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Verbose error handler exposing stack traces to client
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});`,
    secure_code_example: `// SECURE: Hardened production configuration with Helmet & generic errors
const express = require('express');
const helmet = require('helmet');
const app = express();

// Remove tech fingerprint
app.disable('x-powered-by');

// Enforce standard defensive HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Restrict API documentation to development environment only
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Sanitized production error handler
app.use((err, req, res, next) => {
  console.error('[Internal Error]', err); // Log securely server-side
  res.status(500).json({ error: 'An unexpected error occurred. Reference ID: ' + req.id });
});`,
    references_list: JSON.stringify([
      'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
      'https://cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html',
      'https://cwe.mitre.org/data/definitions/16.html'
    ]),
    is_seed_template: 1
  }
];

export const initialRemediations = [
  {
    id: 'REM-01',
    finding_id: 'FIND-01',
    root_cause: 'Untrusted user input from req.body.email is concatenated directly into a dynamic SQL string without parameterization or query binding.',
    recommended_fix: 'Utilize parameterized queries (prepared statements) in SQLite / ORM to ensure input data is bound to placeholder symbols rather than evaluated as executable SQL syntax.',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'db.prepare("SELECT * FROM Users WHERE email = ?").get(email);',
    vulnerable_pattern: '"SELECT * FROM Users WHERE email = \'" + email + "\'";',
    verification_notes: 'Tested on companion service: Injecting "\' OR 1=1--" yields 401 Unauthorized instead of authenticating as administrator.',
    remaining_limitations: 'Parameterized queries protect against SQL injection, but rate-limiting and account lockout mechanisms must also be deployed to prevent brute-force attacks.'
  },
  {
    id: 'REM-02',
    finding_id: 'FIND-02',
    root_cause: 'Client-side navigation checks are bypassed by directly issuing HTTP requests to backend REST routes that lack server-side authorization middleware.',
    recommended_fix: 'Implement robust server-side RBAC middleware that decodes session JWTs and verifies req.user.role === "admin" before granting access to privileged resources.',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'app.get("/admin/users", verifyToken, requireRole("admin"), handler);',
    vulnerable_pattern: 'app.get("/admin/users", handler); // No role guard',
    verification_notes: 'Tested on companion service: Requesting /admin/users with a regular customer token or no token returns HTTP 403 Forbidden.',
    remaining_limitations: 'Role assertions must be backed by revoked-token blacklists or short-lived tokens to ensure privilege revocation occurs immediately.'
  },
  {
    id: 'REM-03',
    finding_id: 'FIND-03',
    root_cause: 'Backend endpoint uses a caller-controlled integer ID from the route path to query the database without asserting ownership against the authenticated user context.',
    recommended_fix: 'Validate that the resource.user_id matches req.user.id, or derive the active basket ID strictly from the authenticated session context rather than request parameters.',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'if (basket.user_id !== req.user.id) return res.status(403).json({ error: "Unauthorized" });',
    vulnerable_pattern: 'db.get("SELECT * FROM Baskets WHERE id = ?", [req.params.id]);',
    verification_notes: 'Tested on companion service: User 1 requesting /basket/2 receives 403 Forbidden.',
    remaining_limitations: 'Hierarchical or delegated permissions require comprehensive attribute-based access control (ABAC).'
  },
  {
    id: 'REM-04',
    finding_id: 'FIND-04',
    root_cause: 'Untrusted user input is passed into unsafe DOM sinks (e.g. innerHTML or raw markup interpolation) without contextual HTML encoding.',
    recommended_fix: 'Render dynamic content using safe DOM properties such as textContent or framework data binding, and enforce a strict Content Security Policy (CSP).',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'element.textContent = userString;',
    vulnerable_pattern: 'element.innerHTML = userString;',
    verification_notes: 'Tested on companion service: Payloads containing <iframe src=...> or <script> tags are rendered as literal text without execution.',
    remaining_limitations: 'CSP must be carefully tuned to prevent breaking legitimate third-party assets.'
  },
  {
    id: 'REM-05',
    finding_id: 'FIND-05',
    root_cause: 'Database entities are serialized directly into API responses without field projection or sanitization, exposing password hashes and secrets.',
    recommended_fix: 'Implement explicit database SELECT projections and DTO transformation layers to strip sensitive attributes before sending JSON responses.',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'SELECT id, username, email, created_at FROM Users',
    vulnerable_pattern: 'SELECT * FROM Users',
    verification_notes: 'Tested on companion service: API returns clean profile objects with password, totp, and salt fields excluded.',
    remaining_limitations: 'All future schema additions must be evaluated against exposure policies.'
  },
  {
    id: 'REM-06',
    finding_id: 'FIND-06',
    root_cause: 'Default framework settings expose fingerprint headers (X-Powered-By), interactive documentation in production, and stack traces.',
    recommended_fix: 'Deploy Helmet middleware, strip server identification headers, disable debug endpoints in production, and standardize error handling.',
    implementation_status: 'Applied to Companion',
    secure_pattern: 'app.disable("x-powered-by"); app.use(helmet());',
    vulnerable_pattern: 'app.use("/api-docs", swaggerUi); // Unconditionally mounted',
    verification_notes: 'Tested on companion service: Security headers verified present; server signature suppressed.',
    remaining_limitations: 'Security headers provide defense-in-depth but do not replace underlying application code security.'
  }
];
