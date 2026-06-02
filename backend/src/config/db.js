const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let useSqlite = process.env.USE_SQLITE === 'true';
let mysqlPool = null;
let sqliteDb = null;

// Initialize SQLite database
function initSQLite() {
  const dbPath = path.resolve(__dirname, '../../hirescheduler.db');
  sqliteDb = new sqlite3.Database(dbPath);
  return sqliteDb;
}

// Unified query wrapper
async function query(sql, params = []) {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  } else {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  }
}

// Unified run wrapper (for INSERT, UPDATE, DELETE)
async function run(sql, params = []) {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    });
  } else {
    const [result] = await mysqlPool.execute(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  }
}

// Unified get single row wrapper
async function get(sql, params = []) {
  if (useSqlite) {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  } else {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows[0] || null;
  }
}

async function connectAndBootstrap() {
  if (!useSqlite) {
    try {
      console.log('Attempting to connect to MySQL database...');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hirescheduler',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 4000 // 4 seconds connection timeout
      });
      
      // Test the connection to ensure server is actually reachable
      await mysqlPool.query('SELECT 1');
      console.log('MySQL database connected successfully.');
      
      // Create tables with MySQL dialect
      await run(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'interviewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      await run(`CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        deadline DATETIME NOT NULL,
        max_selectable_dates INT DEFAULT 3,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      await run(`CREATE TABLE IF NOT EXISTS campaign_dates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        date DATE NOT NULL,
        max_capacity INT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
      )`);

      await run(`CREATE TABLE IF NOT EXISTS availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        campaign_id INT NOT NULL,
        campaign_date_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (campaign_date_id) REFERENCES campaign_dates(id) ON DELETE CASCADE,
        UNIQUE(user_id, campaign_id, campaign_date_id)
      )`);

      await run(`CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        employee_id VARCHAR(50) NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      )`);

      console.log('MySQL schemas checked/initialized.');
    } catch (err) {
      console.warn('⚠️ WARNING: MySQL database connection failed. Error details:', err.message);
      console.warn('⚙️ Self-Healing Triggered: Falling back to local SQLite offline database layer...');
      useSqlite = true;
    }
  }

  if (useSqlite) {
    console.log('Using SQLite database layer...');
    initSQLite();
    
    // Create tables with SQLite dialect
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id VARCHAR(50) UNIQUE,
      email VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'interviewer'
    )`);

    await run(`CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(150) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      deadline DATETIME NOT NULL,
      max_selectable_dates INT DEFAULT 3,
      status VARCHAR(20) DEFAULT 'active'
    )`);

    await run(`CREATE TABLE IF NOT EXISTS campaign_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      date DATE NOT NULL,
      max_capacity INTEGER NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )`);

    await run(`CREATE TABLE IF NOT EXISTS availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      campaign_date_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (campaign_date_id) REFERENCES campaign_dates(id) ON DELETE CASCADE,
      UNIQUE(user_id, campaign_id, campaign_date_id)
    )`);

    await run(`CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(100) NOT NULL,
      employee_id VARCHAR(50) NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at DATETIME NOT NULL
    )`);
    
    console.log('SQLite tables initialized successfully.');
  }

  // Insert default administrator and default interviewers for easy testing if users table is empty
  const usersCount = await get(`SELECT COUNT(*) as cnt FROM users`);
  if (usersCount.cnt === 0) {
    console.log('Seeding initial system users...');
    // Seed HR Admin
    await run(
      `INSERT INTO users (email, name, role) VALUES (?, ?, ?)`,
      ['admin@hirescheduler.com', 'HR Administrator', 'admin']
    );

    // Seed some Interviewers
    const interviewers = [
      { employee_id: 'EMP001', email: 'john@hirescheduler.com', name: 'John Doe' },
      { employee_id: 'EMP002', email: 'david@hirescheduler.com', name: 'David Smith' },
      { employee_id: 'EMP003', email: 'alex@hirescheduler.com', name: 'Alex Johnson' },
      { employee_id: 'EMP004', email: 'kumar@hirescheduler.com', name: 'Kumar Patel' },
      { employee_id: 'EMP005', email: 'peter@hirescheduler.com', name: 'Peter Parker' },
      { employee_id: 'EMP006', email: 'ram@hirescheduler.com', name: 'Ram Singh' }
    ];

    for (const intv of interviewers) {
      await run(
        `INSERT INTO users (employee_id, email, name, role) VALUES (?, ?, ?, ?)`,
        [intv.employee_id, intv.email, intv.name, 'interviewer']
      );
    }
    console.log('Default users successfully seeded.');
  }
}

module.exports = {
  query,
  run,
  get,
  connectAndBootstrap
};
