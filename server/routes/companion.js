import express from 'express';
import Database from 'better-sqlite3';

const router = express.Router();

// Isolated in-memory database strictly for the Companion Patched / Vulnerable Testbed
const companionDb = new Database(':memory:');

companionDb.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    totp_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE baskets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total_price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Seed initial test users
  INSERT INTO users (id, username, email, password_hash, role, totp_secret) VALUES
  (1, 'admin', 'admin@juice-sh.op', '0192023a7bbd73250516f069df18b500', 'admin', 'JBSWY3DPEHPK3PXP'),
  (2, 'bender', 'bender@juice-sh.op', '5f4dcc3b5aa765d61d8327deb882cf99', 'customer', NULL),
  (3, 'jim', 'jim@juice-sh.op', '7c6a63048b156271a3902fbc0e44fce4', 'customer', NULL);

  -- Seed sample customer baskets
  INSERT INTO baskets (id, user_id, items, total_price) VALUES
  (1, 1, '[{"id": 1, "name": "Apple Juice (1000ml)", "qty": 2, "price": 3.98}]', 3.98),
  (2, 2, '[{"id": 2, "name": "Orange Juice (1000ml)", "qty": 1, "price": 2.49}, {"id": 3, "name": "OWASP Juice Shop Logo T-Shirt", "qty": 1, "price": 19.99}]', 22.48),
  (3, 3, '[{"id": 4, "name": "Raspberry Juice (1000ml)", "qty": 3, "price": 10.47}]', 10.47);
`);

// Mock JWT generator / decoder for companion testing
function signToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Date.now() + 3600000
  })).toString('base64');
}

function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const jsonStr = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(jsonStr);
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// COMPANION METADATA
// ============================================================================
router.get('/info', (req, res) => {
  res.json({
    service: 'VulnLab Companion Testbed',
    version: '1.0.0',
    description: 'Separated testbed hosting deliberately vulnerable code vs genuine patched implementations for live side-by-side comparison and verification.',
    vulnerable_base_url: '/api/companion/vulnerable',
    patched_base_url: '/api/companion/patched',
    supported_verifications: [
      { id: 'FIND-01', name: 'SQL Injection Authentication Bypass', endpoint: '/login' },
      { id: 'FIND-02', name: 'Broken Access Control: Admin Route', endpoint: '/admin/users' },
      { id: 'FIND-03', name: 'IDOR Basket Tampering', endpoint: '/basket/:id' },
      { id: 'FIND-04', name: 'Cross-Site Scripting (XSS)', endpoint: '/search' },
      { id: 'FIND-05', name: 'Sensitive Data Exposure', endpoint: '/users' },
      { id: 'FIND-06', name: 'Security Misconfiguration', endpoint: '/debug/status' }
    ]
  });
});

// ============================================================================
// 1. VULNERABLE ENDPOINTS (Demonstrating the exact flaw)
// ============================================================================

// FIND-01: Vulnerable SQL Injection Login
router.post('/vulnerable/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Insecure raw string interpolation
  const query = `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${password || ''}' LIMIT 1`;
  
  try {
    const user = companionDb.prepare(query).get();
    if (user) {
      const token = signToken(user);
      return res.json({
        status: 'success',
        message: 'Authentication successful (Vulnerable bypass executed!)',
        authenticated_as: { id: user.id, username: user.username, email: user.email, role: user.role },
        token,
        executed_query: query
      });
    }
    return res.status(401).json({ error: 'Invalid credentials', executed_query: query });
  } catch (err) {
    return res.status(500).json({ error: 'Database syntax error: ' + err.message, executed_query: query });
  }
});

// FIND-02: Vulnerable Broken Access Control Admin Users
router.get('/vulnerable/admin/users', (req, res) => {
  // Flaw: No role or authentication check!
  const users = companionDb.prepare('SELECT id, username, email, role, created_at FROM users').all();
  res.json({
    status: 'success',
    access_granted: true,
    warning: 'Vulnerable: Endpoint granted administrative user data without validating caller role or token!',
    users
  });
});

// FIND-03: Vulnerable IDOR Basket Lookup
router.get('/vulnerable/basket/:id', (req, res) => {
  const basketId = req.params.id;
  // Flaw: Direct lookup based solely on user-supplied path ID, ignoring caller identity
  const basket = companionDb.prepare('SELECT * FROM baskets WHERE id = ?').get(basketId);
  if (!basket) return res.status(404).json({ error: 'Basket not found' });

  res.json({
    status: 'success',
    warning: 'Vulnerable: Basket retrieved without checking if the requesting user owns this basket!',
    basket: {
      id: basket.id,
      user_id: basket.user_id,
      items: JSON.parse(basket.items),
      total_price: basket.total_price
    }
  });
});

// FIND-04: Vulnerable Reflected / DOM XSS Search
router.get('/vulnerable/search', (req, res) => {
  const q = req.query.q || '';
  // Flaw: Returns unencoded HTML directly in content
  res.set('Content-Type', 'text/html');
  res.send(`
    <div id="results">
      <h2>Search Results for: ${q}</h2>
      <p>0 products matched your query.</p>
    </div>
  `);
});

// FIND-05: Vulnerable Sensitive Data Exposure
router.get('/vulnerable/users', (req, res) => {
  // Flaw: Exposes password hashes, TOTP secret keys, and internal columns
  const users = companionDb.prepare('SELECT * FROM users').all();
  res.json({
    status: 'success',
    warning: 'Vulnerable: Raw database rows serialized with password_hash and totp_secret exposed!',
    data: users
  });
});

// FIND-06: Vulnerable Security Misconfiguration
router.get('/vulnerable/debug/status', (req, res) => {
  res.set('X-Powered-By', 'Express/4.21.2-vulnerable-debug-mode');
  res.json({
    status: 'online',
    warning: 'Vulnerable: Leaking server environment, tech stack, and internal paths!',
    environment: {
      NODE_ENV: 'development-unsafe',
      DB_PATH: 'C:\\Users\\Veer Menger\\Documents\\antigravity\\beautiful-hawking\\server\\data\\vulnlab.db',
      SECRET_KEY: 'super_secret_insecure_default_key',
      SYSTEM_USER: process.env.USERNAME || 'administrator'
    }
  });
});


// ============================================================================
// 2. PATCHED ENDPOINTS (Demonstrating verified remediation)
// ============================================================================

// FIND-01: Patched Parameterized Query Login
router.post('/patched/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Secure: Parameterized prepared statement guarantees literal data binding
  const stmt = companionDb.prepare('SELECT id, username, email, password_hash, role FROM users WHERE email = ?');
  const user = stmt.get(email);

  // Even if email is "' OR 1=1--", it searches for literal email string "' OR 1=1--" and finds nothing
  if (!user || user.password_hash !== password) {
    return res.status(401).json({
      error: 'Invalid email or password',
      mitigation: 'Parameterized query successfully neutralized SQL injection payload.'
    });
  }

  const token = signToken(user);
  res.json({
    status: 'success',
    message: 'Authenticated successfully using secure parameterized statement',
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
    token
  });
});

// FIND-02: Patched Admin Users with RBAC
router.get('/patched/admin/users', (req, res) => {
  const caller = verifyToken(req);
  if (!caller) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
  }

  // Secure: Strict server-side role check
  if (caller.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Administrative privileges required.',
      caller_role: caller.role,
      mitigation: 'Enforced server-side Role-Based Access Control (RBAC).'
    });
  }

  const users = companionDb.prepare('SELECT id, username, email, role, created_at FROM users').all();
  res.json({
    status: 'success',
    access_granted: true,
    message: 'Authorized administrative access verified.',
    users
  });
});

// FIND-03: Patched IDOR Basket Lookup with Ownership Check
router.get('/patched/basket/:id', (req, res) => {
  const caller = verifyToken(req);
  if (!caller) {
    return res.status(401).json({ error: 'Authentication required to access cart.' });
  }

  const basketId = req.params.id;
  const basket = companionDb.prepare('SELECT * FROM baskets WHERE id = ?').get(basketId);
  if (!basket) return res.status(404).json({ error: 'Basket not found' });

  // Secure: Object ownership assertion
  if (basket.user_id !== caller.id && caller.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden: You do not own this basket.',
      mitigation: 'Object-level authorization prevented unauthorized IDOR access.',
      attempted_basket_id: basketId,
      authenticated_user_id: caller.id
    });
  }

  res.json({
    status: 'success',
    basket: {
      id: basket.id,
      user_id: basket.user_id,
      items: JSON.parse(basket.items),
      total_price: basket.total_price
    }
  });
});

// FIND-04: Patched Output Encoded Search
router.get('/patched/search', (req, res) => {
  const q = req.query.q || '';
  
  // Safe HTML entity encoder helper
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const safeQuery = escapeHtml(q);

  // Secure: Explicit Content Security Policy header + Context-appropriate HTML entity encoding
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`
    <div id="results">
      <h2>Search Results for: <span>${safeQuery}</span></h2>
      <p>0 products matched your query.</p>
    </div>
  `);
});

// FIND-05: Patched Data Minimization User Endpoint
router.get('/patched/users', (req, res) => {
  // Secure: Explicit field projection excluding password hashes and secrets
  const safeUsers = companionDb.prepare('SELECT id, username, email, role, created_at FROM users').all();
  res.json({
    status: 'success',
    mitigation: 'Data minimization applied: password_hash, salt, and totp_secret excluded from response.',
    data: safeUsers
  });
});

// FIND-06: Patched Security Hardened Status Endpoint
router.get('/patched/debug/status', (req, res) => {
  // Secure: Standard security headers + suppressed tech fingerprints
  res.removeHeader('X-Powered-By');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Content-Security-Policy', "default-src 'self'");
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.json({
    status: 'online',
    mitigation: 'Technology stack signatures stripped, security headers enforced, sensitive environment variables shielded.'
  });
});

export default router;
