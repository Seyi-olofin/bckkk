const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initTransaction, verifyTransaction, verifyWebhookSignature } = require('./lib/paystack');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://folsmeinternationallimited.netlify.app', 'https://folsmeinternational.com', 'https://www.folsmeinternational.com'])
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// API routes first (before static files)
app.get('/api', (req, res) => {
  res.json({
    message: 'FOLSME Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin/*',
      payments: '/api/payments/*',
      products: '/api/products',
      minerals: '/api/minerals'
    }
  });
});

// Static files (frontend) - only for non-API routes
app.use(express.static('.'));

// Session middleware (simple in-memory store for MVP)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

const { init: initDb, getOrders, getOrderByIdOrRef, createOrder, updateOrder, deleteOrder, getProducts, createProduct, updateProduct, deleteProduct, getAdmins, getAdminByEmail, createAdmin, getWallets, getWalletById, createWallet, creditWallet, withdrawWallet, createWithdrawal, listWithdrawals, approveWithdrawal } = require('./lib/db');
let DB = null;

async function ensureDb() {
  if (!DB) DB = await initDb();
  return DB;
}

// --- Payments: init, verify, webhook ---
app.post('/api/payments/init', async (req, res) => {
  const { amount, email, reference, callback_url, metadata } = req.body;
  const secret = process.env.PAYSTACK_SECRET_KEY;

  // amount should be in smallest currency unit (kobo/naira example)
  if (!amount || !email) return res.status(400).json({ success: false, message: 'amount and email required' });

  if (secret) {
    try {
      const result = await initTransaction(secret, { amount, email, reference, callback_url, metadata });
      return res.json({ success: true, provider: 'paystack', result });
    } catch (e) {
      console.error('Paystack init error', e);
      return res.status(502).json({ success: false, message: 'Paystack init failed' });
    }
  }
  // Mock fallback for local dev: persist to SQLite
  try {
    const db = await ensureDb();
    const mockRef = reference || ('MOCK-' + Date.now());
    const order = await createOrder(db, { reference: mockRef, items: metadata && metadata.items || [], amount, currency: 'NGN', customer: { email }, paymentStatus: 'initialized', status: 'pending' });
    return res.json({ success: true, provider: 'mock', authorization_url: '/confirmation.html', reference: mockRef, order });
  } catch (e) {
    console.error('DB mock create error', e);
    return res.status(500).json({ success: false, message: 'db error' });
  }
});

app.get('/api/payments/verify', async (req, res) => {
  const { reference } = req.query;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!reference) return res.status(400).json({ success: false, message: 'reference required' });

  if (secret) {
    try {
      const result = await verifyTransaction(secret, reference);
      return res.json({ success: true, provider: 'paystack', result });
    } catch (e) {
      console.error('Paystack verify error', e);
      return res.status(502).json({ success: false, message: 'Paystack verify failed' });
    }
  }
  // Mock verify: check sqlite orders
  try {
    const db = await ensureDb();
    const o = await getOrderByIdOrRef(db, reference);
    if (!o) return res.status(404).json({ success: false, message: 'order not found' });
    await updateOrder(db, o.id, { paymentStatus: 'success', status: 'processing' });
    const updated = await getOrderByIdOrRef(db, o.id);
    return res.json({ success: true, provider: 'mock', status: 'success', order: updated });
  } catch (e) { console.error(e); return res.status(500).json({ success:false }); }
});

// Webhook receiver (Paystack)
app.post('/api/payments/webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'] || req.headers['x-paystack-signature'.toLowerCase()];
  const rawBody = req.rawBody ? req.rawBody.toString() : '';

  if (secret) {
    const ok = verifyWebhookSignature(secret, rawBody, signature);
    if (!ok) {
      console.warn('Invalid webhook signature');
      return res.status(401).send('invalid signature');
    }
  }

  const event = req.body;
  // Basic processing: handle charge.success / transaction.success events
  try {
    const data = event.data || event;
    const reference = data.reference || (data.transaction && data.transaction.reference) || (data.checkout && data.checkout.reference);
    if (reference) {
      const db = await ensureDb();
      const o = await getOrderByIdOrRef(db, reference);
      if (o) {
        const status = (data.status === 'success' || data.gateway_response === 'Successful') ? 'success' : (data.status || 'unknown');
        await updateOrder(db, o.id, { paymentStatus: status, status: status === 'success' ? 'processing' : o.status });
      } else {
        console.warn('Webhook for unknown order reference', reference);
      }
    }
  } catch (e) {
    console.error('Webhook processing error', e);
  }

  res.sendStatus(200);
});

// --- Admin auth & APIs (SQLite backed) ---
async function ensureAdminUser() {
  const db = await ensureDb();
  // For development: ensure there's a known admin (admin / admin).
  // This will remove existing admin rows and create the dev admin so you can log in reliably.
  try {
    await db.run(`DELETE FROM admins`);
  } catch (e) { /* ignore */ }
  // Create strong default admin password: Admin@2024!
  const strongHash = '$2b$10$F2W6LYu9r1crxV3AjGRtluXJQJ58Gj2sF3yjlzBWVqUU5et4he/0W';
  await createAdmin(db, { id: uuidv4(), email: 'admin@folsme.com', passwordHash: strongHash, name: 'FOLSME Administrator' });
  console.log('Seeded admin: admin@folsme.com / Admin@2024! (change immediately after first login)');
}

ensureAdminUser();

// Auth routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await ensureDb();
    const user = await getAdminByEmail(db, email);
    if (!user) return res.status(401).json({ success: false, message: 'invalid' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ success: false, message: 'invalid' });
    req.session.admin = { id: user.id, email: user.email, name: user.name };
    res.json({ success: true, auth: true, admin: req.session.admin });
  } catch (e) {
    console.error('login error', e); res.status(500).json({ success: false });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.admin) return res.json({ auth: true, admin: req.session.admin });
  return res.status(401).json({ auth: false });
});

// Admin profile and settings endpoints
app.get('/api/admin/profile', requireAdmin, async (req, res) => {
  try {
    const db = await ensureDb();
    const admin = await getAdminByEmail(db, req.session.admin.email);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    // Return admin profile without password hash
    const { passwordHash, ...profile } = admin;
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to load profile' });
  }
});

app.put('/api/admin/profile', requireAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const db = await ensureDb();

    // Check if email is already taken by another admin
    if (email !== req.session.admin.email) {
      const existing = await getAdminByEmail(db, email);
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Update admin profile
    const updated = await db.run(
      'UPDATE admins SET name = ?, email = ?, updatedAt = ? WHERE id = ?',
      [name, email, new Date().toISOString(), req.session.admin.id]
    );

    if (updated.changes > 0) {
      // Update session
      req.session.admin.name = name;
      req.session.admin.email = email;
      res.json({ success: true, message: 'Profile updated successfully', admin: req.session.admin });
    } else {
      res.status(404).json({ success: false, message: 'Admin not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }

    // Validate password strength
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    const db = await ensureDb();
    const admin = await getAdminByEmail(db, req.session.admin.email);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    const updated = await db.run(
      'UPDATE admins SET passwordHash = ?, updatedAt = ? WHERE id = ?',
      [newPasswordHash, new Date().toISOString(), admin.id]
    );

    if (updated.changes > 0) {
      res.json({ success: true, message: 'Password changed successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update password' });
    }
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Password strength validation function
function isStrongPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

// Protect admin routes
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ success: false, message: 'unauthorized' });
}

app.use('/api/admin', requireAdmin);

// Orders (DB backed)
app.get('/api/admin/orders', async (req, res) => {
  const db = await ensureDb();
  const items = await getOrders(db);
  res.json({ success: true, items, total: items.length });
});

app.get('/api/admin/orders/:id', async (req, res) => {
  const db = await ensureDb();
  const o = await getOrderByIdOrRef(db, req.params.id);
  if (!o) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, order: o });
});

app.patch('/api/admin/orders/:id', async (req, res) => {
  const db = await ensureDb();
  const o = await getOrderByIdOrRef(db, req.params.id);
  if (!o) return res.status(404).json({ success: false, message: 'not found' });
  const allowed = ['status', 'paymentStatus'];
  const update = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  const updated = await updateOrder(db, o.id, update);
  res.json({ success: true, order: updated });
});

app.delete('/api/admin/orders/:id', async (req, res) => {
  const db = await ensureDb();
  const deleted = await deleteOrder(db, req.params.id);
  res.json({ success: true, deleted });
});

// Products (DB backed)
app.get('/api/admin/products', async (req, res) => {
  const db = await ensureDb();
  const items = await getProducts(db);
  res.json({ success: true, items, total: items.length });
});

app.post('/api/admin/products', async (req, res) => {
  const db = await ensureDb();
  const p = await createProduct(db, req.body);
  res.json({ success: true, product: p });
});

app.put('/api/admin/products/:id', async (req, res) => {
  const db = await ensureDb();
  const p = await updateProduct(db, req.params.id, req.body);
  if (!p) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, product: p });
});

app.delete('/api/admin/products/:id', async (req, res) => {
  const db = await ensureDb();
  const deleted = await deleteProduct(db, req.params.id);
  res.json({ success: true, deleted });
});

// Wallets
app.get('/api/admin/wallets', async (req, res) => {
  const db = await ensureDb();
  const items = await getWallets(db);
  res.json({ success: true, items });
});

app.get('/api/admin/wallets/:id', async (req, res) => {
  const db = await ensureDb();
  const w = await getWalletById(db, req.params.id);
  if (!w) return res.status(404).json({ success: false });
  res.json({ success: true, wallet: w });
});

app.post('/api/admin/wallets', async (req, res) => {
  const db = await ensureDb();
  const owner = req.body.owner || 'unknown';
  const w = await createWallet(db, owner, req.body.currency);
  res.json({ success: true, wallet: w });
});

app.post('/api/admin/wallets/:id/credit', async (req, res) => {
  const db = await ensureDb();
  const amount = parseInt(req.body.amount || 0, 10);
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'invalid amount' });
  try { const w = await creditWallet(db, req.params.id, amount); res.json({ success: true, wallet: w }); } catch(e){ res.status(500).json({ success:false }); }
});

app.post('/api/admin/wallets/:id/deposit', async (req, res) => {
  const db = await ensureDb();
  const amount = parseInt(req.body.amount || 0, 10);
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'invalid amount' });
  try {
    const w = await creditWallet(db, req.params.id, amount);
    res.json({ success: true, wallet: w });
  } catch(e){
    res.status(500).json({ success:false, message: e.message });
  }
});

app.post('/api/admin/wallets/:id/withdraw', async (req, res) => {
  const db = await ensureDb();
  const amount = parseInt(req.body.amount || 0, 10);
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'invalid amount' });
  // create a withdrawal request instead of instant withdraw
  try {
    const note = req.body.note || '';
    const reqBy = req.session && req.session.admin ? req.session.admin.email : 'admin';
    const wd = await createWithdrawal(db, req.params.id, amount, reqBy, note);
    res.json({ success: true, withdrawal: wd });
  } catch (e) { res.status(500).json({ success:false, message: e.message }); }
});

// Approve withdrawal (requires approval password - dummy for now)
app.post('/api/admin/withdrawals/:id/approve', async (req, res) => {
  const db = await ensureDb();
  const approvalPassword = req.body.password;
  if (approvalPassword !== 'folsme') return res.status(403).json({ success: false, message: 'invalid approval' });
  try {
    const wd = await approveWithdrawal(db, req.params.id, req.session && req.session.admin ? req.session.admin.email : 'system');
    res.json({ success: true, withdrawal: wd });
  } catch (e) { res.status(400).json({ success:false, message: e.message }); }
});

app.get('/api/admin/withdrawals', async (req, res) => {
  const db = await ensureDb();
  const items = await listWithdrawals(db);
  res.json({ success: true, items });
});

// Transaction history for wallets
app.get('/api/admin/wallets/:id/transactions', async (req, res) => {
  try {
    const db = await ensureDb();
    // For now, return withdrawals as transactions. In a real app, you'd have a transactions table
    const withdrawals = await db.all(`SELECT id, amount, status, requestedBy as description, createdAt, 'withdrawal' as type FROM withdrawals WHERE walletId = ? ORDER BY createdAt DESC`, [req.params.id]);
    const deposits = await db.all(`SELECT 'deposit' as type, amount, 'Deposit' as description, createdAt FROM wallet_transactions WHERE walletId = ? ORDER BY createdAt DESC`, [req.params.id]);

    // Mock some deposit transactions for demo
    const mockDeposits = [
      { type: 'deposit', amount: 50000, description: 'Initial deposit', createdAt: '2024-01-01T00:00:00.000Z' },
      { type: 'deposit', amount: 25000, description: 'Bonus deposit', createdAt: '2024-01-15T00:00:00.000Z' }
    ];

    const transactions = [...withdrawals.map(w => ({ ...w, amount: -w.amount })), ...mockDeposits];
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ success: false, message: 'Failed to load transaction history' });
  }
});

// Recent activity endpoint
app.get('/api/admin/activity', async (req, res) => {
  try {
    const db = await ensureDb();

    // Get recent orders, products, and withdrawals
    const recentOrders = await db.all(`SELECT 'New order' as title, reference as description, '📦' as icon, createdAt FROM orders ORDER BY createdAt DESC LIMIT 2`);
    const recentProducts = await db.all(`SELECT 'New product' as title, name as description, '🛍️' as icon, createdAt FROM products ORDER BY createdAt DESC LIMIT 2`);
    const recentWithdrawals = await db.all(`SELECT 'Withdrawal request' as title, ('Amount: ₦' || (amount/100)) as description, '💰' as icon, createdAt FROM withdrawals ORDER BY createdAt DESC LIMIT 2`);

    const activities = [...recentOrders, ...recentProducts, ...recentWithdrawals];
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, activities: activities.slice(0, 5) });
  } catch (error) {
    console.error('Activity endpoint error:', error);
    res.status(500).json({ success: false, message: 'Failed to load recent activity' });
  }
});

// Checkout payment endpoint
app.post('/create-payment', async (req, res) => {
  try {
    const { paymentMethod, formData, cartItems, amount } = req.body;

    if (!formData || !cartItems || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required payment data' });
    }

    const db = await ensureDb();

    // Create order in database
    const orderData = {
      reference: 'FS' + Date.now(),
      items: cartItems,
      amount: amount,
      currency: 'NGN',
      customer: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country
        }
      },
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      status: 'pending'
    };

    const order = await createOrder(db, orderData);

    // For now, simulate successful payment processing
    // In production, this would integrate with actual payment providers
    console.log('Payment processed for order:', order.reference);

    res.json({
      success: true,
      orderId: order.reference,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed. Please try again.'
    });
  }
});

// Frontend API endpoints for dynamic data loading
app.get('/api/products', async (req, res) => {
  try {
    const db = await ensureDb();
    const products = await getProducts(db);
    res.json({ success: true, products });
  } catch (error) {
    console.error('Products API error:', error);
    res.status(500).json({ success: false, message: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const db = await ensureDb();
    const product = await db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    product.specs = JSON.parse(product.specs || '[]');
    product.images = JSON.parse(product.images || '[]');
    res.json({ success: true, product });
  } catch (error) {
    console.error('Product API error:', error);
    res.status(500).json({ success: false, message: 'Failed to load product' });
  }
});

app.get('/api/minerals', async (req, res) => {
  try {
    // Return static mineral data for now
    const minerals = [
      {
        id: 'barite',
        name: 'Barite',
        description: 'High-quality barite mineral for industrial use',
        price: 150000,
        unit: 'tonne',
        image: 'images/minerals/barite.jpg',
        specs: ['Purity: 95%+', 'Particle Size: 200 mesh', 'Origin: Nigeria']
      },
      {
        id: 'coal',
        name: 'Coal',
        description: 'Premium coal resources for energy production',
        price: 85000,
        unit: 'tonne',
        image: 'images/minerals/coal.jpg',
        specs: ['Calorific Value: 6500 kcal/kg', 'Ash Content: <15%', 'Origin: Nigeria']
      },
      {
        id: 'gold',
        name: 'Gold',
        description: 'Gold mining and extraction services',
        price: 25000000,
        unit: 'kg',
        image: 'images/minerals/gold.jpg',
        specs: ['Purity: 22-24 carat', 'Origin: Nigeria', 'Certified authentic']
      },
      {
        id: 'gypsum',
        name: 'Gypsum',
        description: 'High-grade gypsum for construction and manufacturing',
        price: 45000,
        unit: 'tonne',
        image: 'images/minerals/gypsum.jpg',
        specs: ['Purity: 90%+', 'Crystal Form: Selenite', 'Origin: Nigeria']
      },
      {
        id: 'iron-ore',
        name: 'Iron Ore',
        description: 'Rich iron ore deposits for steel production',
        price: 120000,
        unit: 'tonne',
        image: 'images/minerals/iron-ore.jpg',
        specs: ['Fe Content: 62%+', 'Low impurities', 'Origin: Nigeria']
      },
      {
        id: 'kaolin',
        name: 'Kaolin',
        description: 'Premium kaolin clay for ceramics and paper industry',
        price: 65000,
        unit: 'tonne',
        image: 'images/minerals/kaolin.jpg',
        specs: ['Alumina Content: 35%+', 'Brightness: 85%+', 'Origin: Nigeria']
      },
      {
        id: 'zinc',
        name: 'Zinc Ore',
        description: 'High-grade zinc ore for metallurgical applications',
        price: 180000,
        unit: 'tonne',
        image: 'images/minerals/zinc.jpg',
        specs: ['Zn Content: 45%+', 'Pb Content: <2%', 'Origin: Nigeria']
      },
      {
        id: 'bitumen',
        name: 'Bitumen',
        description: 'Natural bitumen for road construction and waterproofing',
        price: 95000,
        unit: 'tonne',
        image: 'images/minerals/bitumen.jpg',
        specs: ['Penetration Grade: 60/70', 'Origin: Nigeria', 'High viscosity']
      }
    ];

    res.json({ success: true, minerals });
  } catch (error) {
    console.error('Minerals API error:', error);
    res.status(500).json({ success: false, message: 'Failed to load minerals' });
  }
});

app.get('/api/orders/user/:email', async (req, res) => {
  try {
    const db = await ensureDb();
    const orders = await db.all(`SELECT * FROM orders WHERE customer LIKE ? ORDER BY createdAt DESC`, [`%${req.params.email}%`]);
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      customer: JSON.parse(order.customer || '{}')
    }));
    res.json({ success: true, orders: parsedOrders });
  } catch (error) {
    console.error('User orders API error:', error);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    // For now, just log the contact message
    // In production, you'd save to database or send email
    console.log('Contact form submission:', { name, email, phone, subject, message });

    res.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!'
    });

  } catch (error) {
    console.error('Contact API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// Sell inquiry submission endpoint
app.post('/submit-sell-inquiry', async (req, res) => {
  try {
    const { type, inquiry, contactInfo } = req.body;

    if (!inquiry || !contactInfo) {
      return res.status(400).json({ success: false, message: 'Missing inquiry or contact data' });
    }

    const db = await ensureDb();

    // Create sell inquiry order
    const inquiryData = {
      reference: 'SI' + Date.now(),
      type: 'sell_inquiry',
      items: [{
        name: `Mineral Sell Inquiry: ${inquiry.mineralType}`,
        quantity: inquiry.quantity,
        unit: inquiry.unit || 'tonnes',
        description: inquiry.description || '',
        price: 0 // Free inquiry
      }],
      amount: 0,
      currency: 'NGN',
      customer: {
        name: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone
      },
      inquiryData: inquiry,
      paymentStatus: 'free',
      status: 'inquiry_submitted'
    };

    const order = await createOrder(db, inquiryData);

    // Log the inquiry for admin review
    console.log('Sell inquiry submitted:', {
      reference: order.reference,
      mineral: inquiry.mineralType,
      quantity: inquiry.quantity,
      contact: contactInfo.email
    });

    res.json({
      success: true,
      orderId: order.reference,
      message: 'Inquiry submitted successfully. We will contact you within 24 hours.'
    });

  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Inquiry submission failed. Please try again.'
    });
  }
});

// Health check endpoint for Railway (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
