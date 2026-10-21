import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;
const HOST = '127.0.0.1';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulate framework fingerprint (FIND-06)
app.use((req, res, next) => {
  res.set('X-Powered-By', 'Express/4.21.2');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', '*');
  next();
});

// In-memory database replicating OWASP Juice Shop schema
const db = new Database(':memory:');
db.exec(`
  CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'customer',
    totpSecret TEXT
  );

  CREATE TABLE Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    price REAL,
    image TEXT
  );

  CREATE TABLE Baskets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER,
    items TEXT,
    totalPrice REAL
  );

  INSERT INTO Users (id, username, email, password, role, totpSecret) VALUES
  (1, 'admin', 'admin@juice-sh.op', '0192023a7bbd73250516f069df18b500', 'admin', 'JBSWY3DPEHPK3PXP'),
  (2, 'bender', 'bender@juice-sh.op', '5f4dcc3b5aa765d61d8327deb882cf99', 'customer', NULL),
  (3, 'jim', 'jim@juice-sh.op', '7c6a63048b156271a3902fbc0e44fce4', 'customer', NULL);

  INSERT INTO Products (name, description, price, image) VALUES
  ('Apple Juice (1000ml)', 'The all-time classic. Freshly squeezed natural apple juice.', 1.99, 'apple_juice.jpg'),
  ('Orange Juice (1000ml)', 'Made from sweet, sun-ripened Spanish oranges.', 2.49, 'orange_juice.jpg'),
  ('Raspberry Juice (1000ml)', 'Tart and invigorating wild raspberry harvest.', 3.49, 'raspberry_juice.jpg'),
  ('OWASP Juice Shop Logo T-Shirt', 'Official cotton t-shirt with official OWASP Juice Shop logo.', 19.99, 'shirt.jpg'),
  ('OWASP Juice Shop CTF Extension', 'Cybersecurity challenge tracker extension for educational events.', 0.00, 'ctf.jpg'),
  ('Green Smoothie', 'Rich in vitamins and antioxidants with spirulina and kiwi.', 4.49, 'green_smoothie.jpg');

  INSERT INTO Baskets (id, UserId, items, totalPrice) VALUES
  (1, 1, '[{"id": 1, "name": "Apple Juice (1000ml)", "quantity": 2, "price": 1.99}]', 3.98),
  (2, 2, '[{"id": 2, "name": "Orange Juice (1000ml)", "quantity": 1, "price": 2.49}, {"id": 4, "name": "OWASP Juice Shop Logo T-Shirt", "quantity": 1, "price": 19.99}]', 22.48);
`);

// Mock token signer
function signToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 86400000
  })).toString('base64');
}

// ----------------------------------------------------------------------------
// API Endpoints replicating Juice Shop
// ----------------------------------------------------------------------------

// Juice Shop Health Probe
app.get('/rest/admin/application-version', (req, res) => {
  res.json({ version: '16.0.0', environment: 'unsafe' });
});

// FIND-01: Vulnerable SQL Injection Login
app.post('/rest/user/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email) return res.status(400).json({ status: 'error', error: 'Email required' });

  // Insecure raw string interpolation
  const query = `SELECT * FROM Users WHERE email = '${email}' AND password = '${password || ''}' LIMIT 1`;
  try {
    const user = db.prepare(query).get();
    if (user) {
      const token = signToken(user);
      return res.json({
        status: 'success',
        data: {
          user: { id: user.id, email: user.email, role: user.role },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + token + '.signature',
          bid: user.id
        }
      });
    }
    return res.status(401).json({ status: 'error', error: 'Invalid email or password.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message, query });
  }
});

// FIND-02: Vulnerable Broken Access Control Admin Users
app.get('/rest/admin/users', (req, res) => {
  const users = db.prepare('SELECT id, username, email, role FROM Users').all();
  res.json({ status: 'success', data: users });
});

// FIND-03: Vulnerable IDOR Basket Retrieval
app.get('/rest/basket/:id', (req, res) => {
  const basket = db.prepare('SELECT * FROM Baskets WHERE id = ?').get(req.params.id);
  if (!basket) return res.status(404).json({ status: 'error', error: 'Basket not found' });
  res.json({
    status: 'success',
    data: {
      id: basket.id,
      UserId: basket.UserId,
      Products: JSON.parse(basket.items),
      totalPrice: basket.totalPrice
    }
  });
});

// FIND-05: Vulnerable Sensitive Data Exposure in User API
app.get('/api/Users', (req, res) => {
  const users = db.prepare('SELECT * FROM Users').all();
  res.json(users);
});

// Products catalog
app.get('/rest/products/search', (req, res) => {
  const q = req.query.q || '';
  const products = db.prepare("SELECT * FROM Products WHERE name LIKE ?").all(`%${q}%`);
  res.json({ status: 'success', data: products });
});

// FIND-06: Exposed Swagger Docs
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Juice Shop Swagger UI</title></head>
      <body style="font-family:sans-serif; background:#f4f4f4; padding:20px;">
        <h2>OWASP Juice Shop OpenAPI / Swagger Specification</h2>
        <p><b>Security Misconfiguration Notice:</b> Interactive API documentation exposed in production.</p>
        <pre>{
  "swagger": "2.0",
  "info": { "title": "Juice Shop REST API", "version": "16.0.0" },
  "paths": {
    "/rest/user/login": { "post": { "summary": "Authentication endpoint" } },
    "/rest/basket/{id}": { "get": { "summary": "Basket endpoint" } },
    "/api/Users": { "get": { "summary": "User entities" } }
  }
}</pre>
      </body>
    </html>
  `);
});

// ----------------------------------------------------------------------------
// OWASP Juice Shop Storefront UI (HTML/CSS/JS)
// ----------------------------------------------------------------------------
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OWASP Juice Shop</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/x-icon" href="https://raw.githubusercontent.com/juice-shop/juice-shop/master/frontend/src/assets/public/favicon_js.ico">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #303030; color: #fff; }
    
    /* Top Navbar */
    .navbar { background: #546e7a; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
    .nav-brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: bold; color: #fff; text-decoration: none; }
    .nav-search { display: flex; align-items: center; background: rgba(255,255,255,0.15); border-radius: 4px; padding: 5px 12px; width: 350px; }
    .nav-search input { background: transparent; border: none; outline: none; color: #fff; width: 100%; font-size: 14px; }
    .nav-search input::placeholder { color: #cfd8dc; }
    .nav-actions { display: flex; align-items: center; gap: 15px; }
    .btn { background: #e91e63; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: bold; text-decoration: none; }
    .btn:hover { background: #d81b60; }
    .btn-outline { background: transparent; border: 1px solid #fff; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); }
    
    /* Notification Banner */
    .lab-banner { background: #ff9800; color: #000; text-align: center; padding: 6px; font-size: 12px; font-weight: bold; }
    
    /* Main Layout */
    .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
    .section-title { font-size: 22px; margin-bottom: 20px; color: #eceff1; border-bottom: 1px solid #455a64; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    
    /* Search Results / XSS reflection container (FIND-04) */
    #search-reflection { margin-bottom: 20px; padding: 12px; background: #37474f; border-radius: 4px; display: none; }
    
    /* Product Grid */
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .product-card { background: #424242; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between; }
    .product-img { height: 160px; background: #37474f; display: flex; align-items: center; justify-content: center; font-size: 48px; }
    .product-body { padding: 15px; }
    .product-title { font-size: 16px; font-weight: bold; margin-bottom: 6px; color: #fff; }
    .product-desc { font-size: 13px; color: #b0bec5; margin-bottom: 15px; min-height: 40px; }
    .product-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #4f4f4f; padding-top: 10px; }
    .price { font-size: 16px; font-weight: bold; color: #81c784; }
    
    /* Login Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none; align-items: center; justify-content: center; z-index: 100; }
    .modal { background: #424242; border-radius: 6px; width: 400px; padding: 25px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .modal-title { font-size: 18px; margin-bottom: 15px; font-weight: bold; border-bottom: 1px solid #546e7a; padding-bottom: 8px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; font-size: 12px; margin-bottom: 5px; color: #cfd8dc; font-weight: 500; }
    .form-group input { width: 100%; padding: 10px; background: #303030; border: 1px solid #546e7a; border-radius: 4px; color: #fff; font-size: 14px; }
    .hint { font-size: 11px; color: #90a4ae; margin-top: 4px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  </style>
</head>
<body>

  <div class="lab-banner">
    🧪 AUTHORIZED LAB TARGET: OWASP Juice Shop v16.0.0 (Local Loopback 127.0.0.1:3000)
  </div>

  <nav class="navbar">
    <a href="/" class="nav-brand">
      🥤 OWASP Juice Shop
    </a>

    <div class="nav-search">
      <input type="text" id="searchInput" placeholder="Search for juices, items... (Try XSS payload)" onkeydown="if(event.key==='Enter') executeSearch()">
      <span style="cursor:pointer;" onclick="executeSearch()">🔍</span>
    </div>

    <div class="nav-actions">
      <span id="userStatus" style="font-size: 13px; color: #81c784; font-weight: bold; display: none;"></span>
      <button class="btn btn-outline" id="loginBtn" onclick="openLoginModal()">Account / Log In</button>
      <button class="btn btn-outline" onclick="openBasket()">🛒 Basket (<span id="cartCount">0</span>)</button>
      <a href="http://127.0.0.1:5173" class="btn" style="background:#00acc1;">Return to VulnLab</a>
    </div>
  </nav>

  <div class="container">
    <!-- Search Query Reflection (Vulnerable to DOM XSS - FIND-04) -->
    <div id="search-reflection"></div>

    <div class="section-title">
      <span>All Products</span>
      <span style="font-size: 13px; color: #90a4ae;">Authorized Target Application</span>
    </div>

    <div class="product-grid" id="productGrid">
      <div class="product-card">
        <div class="product-img">🍏</div>
        <div class="product-body">
          <div class="product-title">Apple Juice (1000ml)</div>
          <div class="product-desc">The all-time classic. Freshly squeezed natural apple juice.</div>
          <div class="product-footer">
            <span class="price">$1.99</span>
            <button class="btn" onclick="addToCart(1)">Add to Basket</button>
          </div>
        </div>
      </div>

      <div class="product-card">
        <div class="product-img">🍊</div>
        <div class="product-body">
          <div class="product-title">Orange Juice (1000ml)</div>
          <div class="product-desc">Made from sweet, sun-ripened Spanish oranges.</div>
          <div class="product-footer">
            <span class="price">$2.49</span>
            <button class="btn" onclick="addToCart(2)">Add to Basket</button>
          </div>
        </div>
      </div>

      <div class="product-card">
        <div class="product-img">🍇</div>
        <div class="product-body">
          <div class="product-title">Raspberry Juice (1000ml)</div>
          <div class="product-desc">Tart and invigorating wild raspberry harvest.</div>
          <div class="product-footer">
            <span class="price">$3.49</span>
            <button class="btn" onclick="addToCart(3)">Add to Basket</button>
          </div>
        </div>
      </div>

      <div class="product-card">
        <div class="product-img">👕</div>
        <div class="product-body">
          <div class="product-title">OWASP Juice Shop Logo T-Shirt</div>
          <div class="product-desc">Official cotton t-shirt with official OWASP Juice Shop logo.</div>
          <div class="product-footer">
            <span class="price">$19.99</span>
            <button class="btn" onclick="addToCart(4)">Add to Basket</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Login Modal (Vulnerable to SQL Injection - FIND-01) -->
  <div class="modal-overlay" id="loginModal">
    <div class="modal">
      <div class="modal-title">Customer Login</div>
      <form id="loginForm" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label>Email Address</label>
          <input type="text" id="emailInput" value="' OR 1=1--" placeholder="email@domain.com or SQLi payload" required>
          <div class="hint">Try injection payload: <code style="color:#00e5ff;">' OR 1=1--</code></div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" id="passwordInput" value="arbitraryPassword" placeholder="Your password">
        </div>

        <div id="loginFeedback" style="font-size:12px; margin-bottom:10px; display:none;"></div>

        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="closeLoginModal()">Cancel</button>
          <button type="submit" class="btn">Log In</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // State
    let cartItems = 0;
    let currentUser = null;

    function openLoginModal() {
      document.getElementById('loginModal').style.display = 'flex';
    }

    function closeLoginModal() {
      document.getElementById('loginModal').style.display = 'none';
    }

    function addToCart(id) {
      cartItems++;
      document.getElementById('cartCount').textContent = cartItems;
      alert('Product added to basket!');
    }

    // FIND-01: Login with SQL Injection support
    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('emailInput').value;
      const password = document.getElementById('passwordInput').value;
      const feedback = document.getElementById('loginFeedback');

      try {
        const res = await fetch('/rest/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
          currentUser = data.data.user;
          feedback.style.color = '#81c784';
          feedback.innerHTML = '<b>Authentication Successful!</b><br>Logged in as: ' + currentUser.email + ' (' + currentUser.role + ')';
          feedback.style.display = 'block';

          setTimeout(() => {
            closeLoginModal();
            document.getElementById('loginBtn').style.display = 'none';
            const statusEl = document.getElementById('userStatus');
            statusEl.textContent = '👑 ' + currentUser.email + ' (' + currentUser.role + ')';
            statusEl.style.display = 'inline';
          }, 1200);
        } else {
          feedback.style.color = '#e57373';
          feedback.textContent = data.error || 'Invalid credentials';
          feedback.style.display = 'block';
        }
      } catch (err) {
        feedback.style.color = '#e57373';
        feedback.textContent = 'Network error: ' + err.message;
        feedback.style.display = 'block';
      }
    }

    // FIND-04: Vulnerable DOM XSS search reflection
    function executeSearch() {
      const q = document.getElementById('searchInput').value;
      if (!q) return;

      const container = document.getElementById('search-reflection');
      container.style.display = 'block';
      // Insecure DOM sink demonstrating Finding 04:
      container.innerHTML = "<h4>Search Results for: " + q + "</h4><p>Found 0 items matching your query.</p>";
      
      // If script tags or iframes are injected, execute them for controlled proof of concept
      const scripts = container.getElementsByTagName("script");
      for (let i = 0; i < scripts.length; i++) {
        eval(scripts[i].innerText);
      }
    }

    // FIND-03: IDOR Basket viewer
    async function openBasket() {
      const basketId = prompt("Enter Basket ID to retrieve (IDOR Test: try '1' or '2'):", "2");
      if (!basketId) return;

      try {
        const res = await fetch('/rest/basket/' + basketId);
        const data = await res.json();
        if (data.status === 'success') {
          alert('IDOR Exploitation Proof!\\nRetrieved Basket ID ' + basketId + ' belonging to User ' + data.data.UserId + ':\\nTotal: $' + data.data.totalPrice + '\\nItems: ' + JSON.stringify(data.data.Products, null, 2));
        } else {
          alert('Error: ' + data.error);
        }
      } catch(err) {
        alert('Fetch error: ' + err.message);
      }
    }

    // Check URL search parameters on load
    window.onload = function() {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        document.getElementById('searchInput').value = q;
        executeSearch();
      }
    };
  </script>
</body>
</html>
  `);
});

app.listen(PORT, HOST, () => {
  console.log(`[Juice Shop Target] Running on http://${HOST}:${PORT}`);
  console.log(`[Juice Shop Target] Health endpoint active at http://${HOST}:${PORT}/rest/admin/application-version`);
});
