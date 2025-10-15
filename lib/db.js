const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { v4: uuidv4 } = require('uuid');

// Use PostgreSQL for production-grade database (conditionally loaded)
let Pool;
try {
  Pool = require('pg').Pool;
} catch (e) {
  // pg module not available, will use SQLite
  console.log('PostgreSQL module not available, using SQLite');
}

// Database configuration - supports both SQLite (dev) and PostgreSQL (prod)
const USE_POSTGRESQL = process.env.USE_POSTGRESQL === 'true';
const DB_FILE = path.join(__dirname, '..', 'data', 'database.sqlite');
const SEED_DIR = path.join(__dirname, '..', 'data');

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'folsme_db',
  user: process.env.DB_USER || 'folsme_user',
  password: process.env.DB_PASSWORD || 'folsme_secure_password_2024',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function init() {
  if (USE_POSTGRESQL) {
    return await initPostgreSQL();
  } else {
    return await initSQLite();
  }
}

async function initSQLite() {
  console.log('🔄 Initializing SQLite database...');
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  await db.exec(`PRAGMA foreign_keys = ON;`);

  await db.exec(`CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY, email TEXT UNIQUE, passwordHash TEXT, name TEXT, createdAt TEXT
  );`);

  await db.exec(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT, price_cents INTEGER, description TEXT, specs TEXT, images TEXT, createdAt TEXT, updatedAt TEXT
  );`);

  await db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, reference TEXT UNIQUE, items TEXT, amount INTEGER, currency TEXT, customer TEXT, paymentStatus TEXT, status TEXT, createdAt TEXT, updatedAt TEXT
  );`);

  await db.exec(`CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY, owner TEXT, balance INTEGER DEFAULT 0, currency TEXT, createdAt TEXT, updatedAt TEXT
  );`);

  await db.exec(`CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY, walletId TEXT, amount INTEGER, status TEXT DEFAULT 'pending', requestedBy TEXT, approvedBy TEXT, createdAt TEXT, updatedAt TEXT, note TEXT,
    FOREIGN KEY(walletId) REFERENCES wallets(id)
  );`);

  // seed from JSON files if tables empty
  const a = await db.get(`SELECT COUNT(1) as c FROM admins`);
  if (a.c === 0) {
    const adminsFile = path.join(SEED_DIR, 'admins.json');
    if (fs.existsSync(adminsFile)) {
      try {
        const arr = JSON.parse(fs.readFileSync(adminsFile,'utf8'));
        for (const u of arr) {
          await db.run(`INSERT OR IGNORE INTO admins (id,email,passwordHash,name,createdAt) VALUES (?,?,?,?,?)`, [u.id || uuidv4(), u.email, u.passwordHash || '', u.name || 'Admin', new Date().toISOString()]);
        }
      } catch(e){/* ignore */}
    }
  }

  const p = await db.get(`SELECT COUNT(1) as c FROM products`);
  if (p.c === 0) {
    const prodFile = path.join(SEED_DIR, 'products.json');
    if (fs.existsSync(prodFile)) {
      try{ const arr = JSON.parse(fs.readFileSync(prodFile,'utf8')); for(const it of arr){ await db.run(`INSERT OR IGNORE INTO products (id,name,price_cents,description,specs,images,createdAt) VALUES (?,?,?,?,?,?,?)`, [it.id || uuidv4(), it.name, it.price_cents || it.price || 0, it.description || '', JSON.stringify(it.specs||[]), JSON.stringify(it.images||[]), new Date().toISOString()]); }}catch(e){}
    }
  }

  const o = await db.get(`SELECT COUNT(1) as c FROM orders`);
  if (o.c === 0) {
    const ordersFile = path.join(SEED_DIR, 'orders.json');
    if (fs.existsSync(ordersFile)) {
      try{ const arr = JSON.parse(fs.readFileSync(ordersFile,'utf8')); for(const it of arr){ await db.run(`INSERT OR IGNORE INTO orders (id,reference,items,amount,currency,customer,paymentStatus,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`, [it.id || uuidv4(), it.reference || ('ORD-'+Date.now()), JSON.stringify(it.items||[]), it.amount||0, it.currency||'NGN', JSON.stringify(it.customer||{}), it.paymentStatus||'initialized', it.status||'pending', it.createdAt || new Date().toISOString()]); }}catch(e){}
    }
  }

  console.log('✅ SQLite database initialized successfully');
  return db;
}

async function initPostgreSQL() {
  console.log('🔄 Initializing PostgreSQL database...');

  if (!Pool) {
    throw new Error('PostgreSQL module not available. Set USE_POSTGRESQL=false to use SQLite.');
  }

  const pool = new Pool(pgConfig);

  // Test connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection established');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      price_cents INTEGER DEFAULT 0,
      description TEXT,
      specs JSONB DEFAULT '[]'::jsonb,
      images JSONB DEFAULT '[]'::jsonb,
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reference TEXT UNIQUE NOT NULL,
      items JSONB DEFAULT '[]'::jsonb,
      amount INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'NGN',
      customer JSONB DEFAULT '{}'::jsonb,
      paymentStatus TEXT DEFAULT 'initialized',
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'NGN',
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      walletId UUID REFERENCES wallets(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      requestedBy TEXT,
      approvedBy TEXT,
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      note TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      walletId UUID REFERENCES wallets(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'deposit' or 'withdrawal'
      description TEXT,
      createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed data if tables are empty
  await seedPostgreSQLData(pool);

  console.log('✅ PostgreSQL database initialized successfully');
  return pool;
}

async function seedPostgreSQLData(pool) {
  // Seed admins
  const adminCount = await pool.query('SELECT COUNT(*) as count FROM admins');
  if (parseInt(adminCount.rows[0].count) === 0) {
    const adminsFile = path.join(SEED_DIR, 'admins.json');
    if (fs.existsSync(adminsFile)) {
      try {
        const arr = JSON.parse(fs.readFileSync(adminsFile, 'utf8'));
        for (const u of arr) {
          await pool.query(
            'INSERT INTO admins (id, email, passwordHash, name) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            [u.id || uuidv4(), u.email, u.passwordHash || '', u.name || 'Admin']
          );
        }
      } catch(e) { console.warn('Admin seeding failed:', e.message); }
    }
  }

  // Seed products
  const productCount = await pool.query('SELECT COUNT(*) as count FROM products');
  if (parseInt(productCount.rows[0].count) === 0) {
    const prodFile = path.join(SEED_DIR, 'products.json');
    if (fs.existsSync(prodFile)) {
      try {
        const arr = JSON.parse(fs.readFileSync(prodFile, 'utf8'));
        for (const it of arr) {
          await pool.query(
            'INSERT INTO products (id, name, price_cents, description, specs, images) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
            [it.id || uuidv4(), it.name, it.price_cents || it.price || 0, it.description || '', JSON.stringify(it.specs || []), JSON.stringify(it.images || [])]
          );
        }
      } catch(e) { console.warn('Product seeding failed:', e.message); }
    }
  }

  // Seed orders
  const orderCount = await pool.query('SELECT COUNT(*) as count FROM orders');
  if (parseInt(orderCount.rows[0].count) === 0) {
    const ordersFile = path.join(SEED_DIR, 'orders.json');
    if (fs.existsSync(ordersFile)) {
      try {
        const arr = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
        for (const it of arr) {
          await pool.query(
            'INSERT INTO orders (id, reference, items, amount, currency, customer, paymentStatus, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (reference) DO NOTHING',
            [it.id || uuidv4(), it.reference || ('ORD-' + Date.now()), JSON.stringify(it.items || []), it.amount || 0, it.currency || 'NGN', JSON.stringify(it.customer || {}), it.paymentStatus || 'initialized', it.status || 'pending']
          );
        }
      } catch(e) { console.warn('Order seeding failed:', e.message); }
    }
  }
}

async function getOrders(db) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM orders ORDER BY "createdAt" DESC');
    return result.rows.map(r => ({
      ...r,
      items: r.items || [],
      customer: r.customer || {}
    }));
  } else {
    const rows = await db.all(`SELECT * FROM orders ORDER BY createdAt DESC`);
    return rows.map(r => ({ ...r, items: JSON.parse(r.items||'[]'), customer: JSON.parse(r.customer||'{}') }));
  }
}

async function getOrderByIdOrRef(db, id) {
  if (USE_POSTGRESQL) {
    let result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      result = await db.query('SELECT * FROM orders WHERE reference = $1', [id]);
    }
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      items: row.items || [],
      customer: row.customer || {}
    };
  } else {
    let row = await db.get(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (!row) row = await db.get(`SELECT * FROM orders WHERE reference = ?`, [id]);
    if (!row) return null;
    row.items = JSON.parse(row.items||'[]'); row.customer = JSON.parse(row.customer||'{}');
    return row;
  }
}

async function createOrder(db, order) {
  if (USE_POSTGRESQL) {
    const id = order.id || uuidv4();
    await db.query(
      'INSERT INTO orders (id, reference, items, amount, currency, customer, paymentStatus, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, order.reference, JSON.stringify(order.items || []), order.amount || 0, order.currency || 'NGN', JSON.stringify(order.customer || {}), order.paymentStatus || 'initialized', order.status || 'pending']
    );
    return getOrderByIdOrRef(db, id);
  } else {
    const id = order.id || uuidv4();
    await db.run(`INSERT INTO orders (id,reference,items,amount,currency,customer,paymentStatus,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`, [id, order.reference, JSON.stringify(order.items||[]), order.amount||0, order.currency||'NGN', JSON.stringify(order.customer||{}), order.paymentStatus||'initialized', order.status||'pending', order.createdAt || new Date().toISOString()]);
    return getOrderByIdOrRef(db, id);
  }
}

async function updateOrder(db, id, fields) {
  if (USE_POSTGRESQL) {
    const existing = await getOrderByIdOrRef(db, id);
    if (!existing) return null;
    const updates = Object.assign({}, existing, fields);
    await db.query(
      'UPDATE orders SET items = $1, amount = $2, currency = $3, customer = $4, paymentStatus = $5, status = $6, "updatedAt" = $7 WHERE id = $8',
      [JSON.stringify(updates.items || existing.items || []), updates.amount || existing.amount || 0, updates.currency || existing.currency || 'NGN', JSON.stringify(updates.customer || existing.customer || {}), updates.paymentStatus || existing.paymentStatus || '', updates.status || existing.status || '', new Date().toISOString(), existing.id]
    );
    return getOrderByIdOrRef(db, existing.id);
  } else {
    const existing = await getOrderByIdOrRef(db, id);
    if (!existing) return null;
    const updates = Object.assign({}, existing, fields);
    await db.run(`UPDATE orders SET items = ?, amount = ?, currency = ?, customer = ?, paymentStatus = ?, status = ?, updatedAt = ? WHERE id = ?`, [JSON.stringify(updates.items||existing.items||[]), updates.amount||existing.amount||0, updates.currency||existing.currency||'NGN', JSON.stringify(updates.customer||existing.customer||{}), updates.paymentStatus||existing.paymentStatus||'', updates.status||existing.status||'', new Date().toISOString(), existing.id]);
    return getOrderByIdOrRef(db, existing.id);
  }
}

async function deleteOrder(db, id) {
  if (USE_POSTGRESQL) {
    const existing = await getOrderByIdOrRef(db, id);
    if (!existing) return 0;
    const result = await db.query('DELETE FROM orders WHERE id = $1', [existing.id]);
    return result.rowCount || 0;
  } else {
    const existing = await getOrderByIdOrRef(db, id);
    if (!existing) return 0;
    const res = await db.run(`DELETE FROM orders WHERE id = ?`, [existing.id]);
    return res.changes || 0;
  }
}

async function getProducts(db) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM products ORDER BY "createdAt" DESC');
    return result.rows.map(r => ({
      ...r,
      specs: r.specs || [],
      images: r.images || []
    }));
  } else {
    const rows = await db.all(`SELECT * FROM products ORDER BY createdAt DESC`);
    return rows.map(r => ({ ...r, specs: JSON.parse(r.specs||'[]'), images: JSON.parse(r.images||'[]') }));
  }
}

async function createProduct(db, p) {
  if (USE_POSTGRESQL) {
    const id = p.id || uuidv4();
    await db.query(
      'INSERT INTO products (id, name, price_cents, description, specs, images) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, p.name, p.price_cents || 0, p.description || '', JSON.stringify(p.specs || []), JSON.stringify(p.images || [])]
    );
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  } else {
    const id = p.id || uuidv4();
    await db.run(`INSERT INTO products (id,name,price_cents,description,specs,images,createdAt) VALUES (?,?,?,?,?,?,?)`, [id, p.name, p.price_cents||0, p.description||'', JSON.stringify(p.specs||[]), JSON.stringify(p.images||[]), new Date().toISOString()]);
    return (await db.get(`SELECT * FROM products WHERE id = ?`, [id]));
  }
}

async function updateProduct(db, id, p) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    const existing = result.rows[0];
    const merged = Object.assign({}, existing, p, { updatedAt: new Date().toISOString() });
    await db.query(
      'UPDATE products SET name = $1, price_cents = $2, description = $3, specs = $4, images = $5, "updatedAt" = $6 WHERE id = $7',
      [merged.name, merged.price_cents, merged.description, JSON.stringify(merged.specs || []), JSON.stringify(merged.images || []), merged.updatedAt, id]
    );
    const updatedResult = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return updatedResult.rows[0];
  } else {
    const existing = await db.get(`SELECT * FROM products WHERE id = ?`, [id]);
    if (!existing) return null;
    const merged = Object.assign({}, existing, p, { updatedAt: new Date().toISOString() });
    await db.run(`UPDATE products SET name = ?, price_cents = ?, description = ?, specs = ?, images = ?, updatedAt = ? WHERE id = ?`, [merged.name, merged.price_cents, merged.description, JSON.stringify(merged.specs||[]), JSON.stringify(merged.images||[]), merged.updatedAt, id]);
    return await db.get(`SELECT * FROM products WHERE id = ?`, [id]);
  }
}

async function deleteProduct(db, id) {
  if (USE_POSTGRESQL) {
    const result = await db.query('DELETE FROM products WHERE id = $1', [id]);
    return result.rowCount || 0;
  } else {
    const res = await db.run(`DELETE FROM products WHERE id = ?`, [id]);
    return res.changes || 0;
  }
}

async function getAdmins(db) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT id, email, passwordHash, name FROM admins');
    return result.rows;
  } else {
    const rows = await db.all(`SELECT id,email,passwordHash,name FROM admins`);
    return rows;
  }
}

async function getAdminByEmail(db, email) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    return result.rows[0] || null;
  } else {
    return await db.get(`SELECT * FROM admins WHERE email = ?`, [email]);
  }
}

async function createAdmin(db, user) {
  if (USE_POSTGRESQL) {
    const id = user.id || uuidv4();
    await db.query(
      'INSERT INTO admins (id, email, passwordHash, name) VALUES ($1, $2, $3, $4)',
      [id, user.email, user.passwordHash || '', user.name || 'Admin']
    );
    const result = await db.query('SELECT * FROM admins WHERE id = $1', [id]);
    return result.rows[0];
  } else {
    const id = user.id || uuidv4();
    await db.run(`INSERT INTO admins (id,email,passwordHash,name,createdAt) VALUES (?,?,?,?,?)`, [id, user.email, user.passwordHash||'', user.name||'Admin', new Date().toISOString()]);
    return await db.get(`SELECT * FROM admins WHERE id = ?`, [id]);
  }
}

async function getWallets(db) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM wallets ORDER BY "createdAt" DESC');
    return result.rows;
  } else {
    const rows = await db.all(`SELECT * FROM wallets ORDER BY createdAt DESC`);
    return rows;
  }
}

async function getWalletById(db, id) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM wallets WHERE id = $1', [id]);
    return result.rows[0] || null;
  } else {
    return await db.get(`SELECT * FROM wallets WHERE id = ?`, [id]);
  }
}

async function createWallet(db, owner, currency='NGN') {
  if (USE_POSTGRESQL) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO wallets (id, owner, balance, currency) VALUES ($1, $2, $3, $4)',
      [id, owner, 0, currency]
    );
    return await getWalletById(db, id);
  } else {
    const id = uuidv4();
    await db.run(`INSERT INTO wallets (id,owner,balance,currency,createdAt) VALUES (?,?,?,?,?)`, [id, owner, 0, currency, new Date().toISOString()]);
    return await getWalletById(db, id);
  }
}

async function creditWallet(db, id, amount) {
  if (USE_POSTGRESQL) {
    const w = await getWalletById(db, id);
    if (!w) return null;
    const newBal = (w.balance || 0) + amount;
    await db.query(
      'UPDATE wallets SET balance = $1, "updatedAt" = $2 WHERE id = $3',
      [newBal, new Date().toISOString(), id]
    );
    return await getWalletById(db, id);
  } else {
    const w = await getWalletById(db, id);
    if (!w) return null;
    const newBal = (w.balance || 0) + amount;
    await db.run(`UPDATE wallets SET balance = ?, updatedAt = ? WHERE id = ?`, [newBal, new Date().toISOString(), id]);
    return await getWalletById(db, id);
  }
}

async function withdrawWallet(db, id, amount) {
  if (USE_POSTGRESQL) {
    const w = await getWalletById(db, id);
    if (!w) return null;
    const newBal = (w.balance || 0) - amount;
    if (newBal < 0) throw new Error('insufficient');
    await db.query(
      'UPDATE wallets SET balance = $1, "updatedAt" = $2 WHERE id = $3',
      [newBal, new Date().toISOString(), id]
    );
    return await getWalletById(db, id);
  } else {
    const w = await getWalletById(db, id);
    if (!w) return null;
    const newBal = (w.balance || 0) - amount;
    if (newBal < 0) throw new Error('insufficient');
    await db.run(`UPDATE wallets SET balance = ?, updatedAt = ? WHERE id = ?`, [newBal, new Date().toISOString(), id]);
    return await getWalletById(db, id);
  }
}

async function createWithdrawal(db, walletId, amount, requestedBy, note) {
  if (USE_POSTGRESQL) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO withdrawals (id, walletId, amount, status, requestedBy, note) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, walletId, amount, 'pending', requestedBy, note || '']
    );
    const result = await db.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    return result.rows[0];
  } else {
    const id = uuidv4();
    await db.run(`INSERT INTO withdrawals (id,walletId,amount,status,requestedBy,createdAt,note) VALUES (?,?,?,?,?,?,?)`, [id,walletId,amount,'pending',requestedBy,new Date().toISOString(),note||'']);
    return await db.get(`SELECT * FROM withdrawals WHERE id = ?`, [id]);
  }
}

async function listWithdrawals(db) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM withdrawals ORDER BY "createdAt" DESC');
    return result.rows;
  } else {
    return await db.all(`SELECT * FROM withdrawals ORDER BY createdAt DESC`);
  }
}

async function approveWithdrawal(db, id, approver) {
  if (USE_POSTGRESQL) {
    const result = await db.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    const w = result.rows[0];
    if (!w) return null;
    if (w.status !== 'pending') throw new Error('already processed');
    // debit wallet
    const wallet = await getWalletById(db, w.walletId);
    if (!wallet) throw new Error('wallet not found');
    if ((wallet.balance || 0) < w.amount) throw new Error('insufficient');
    await db.query(
      'UPDATE wallets SET balance = $1, "updatedAt" = $2 WHERE id = $3',
      [wallet.balance - w.amount, new Date().toISOString(), wallet.id]
    );
    await db.query(
      'UPDATE withdrawals SET status = $1, approvedBy = $2, "updatedAt" = $3 WHERE id = $4',
      ['approved', approver, new Date().toISOString(), id]
    );
    const updatedResult = await db.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    return updatedResult.rows[0];
  } else {
    const w = await db.get(`SELECT * FROM withdrawals WHERE id = ?`, [id]);
    if (!w) return null;
    if (w.status !== 'pending') throw new Error('already processed');
    // debit wallet
    const wallet = await getWalletById(db, w.walletId);
    if (!wallet) throw new Error('wallet not found');
    if ((wallet.balance || 0) < w.amount) throw new Error('insufficient');
    await db.run(`UPDATE wallets SET balance = ?, updatedAt = ? WHERE id = ?`, [wallet.balance - w.amount, new Date().toISOString(), wallet.id]);
    await db.run(`UPDATE withdrawals SET status = 'approved', approvedBy = ?, updatedAt = ? WHERE id = ?`, [approver, new Date().toISOString(), id]);
    return await db.get(`SELECT * FROM withdrawals WHERE id = ?`, [id]);
  }
}

module.exports = { init, getOrders, getOrderByIdOrRef, createOrder, updateOrder, deleteOrder, getProducts, createProduct, updateProduct, deleteProduct, getAdmins, getAdminByEmail, createAdmin, getWallets, getWalletById, createWallet, creditWallet, withdrawWallet, createWithdrawal, listWithdrawals, approveWithdrawal };

