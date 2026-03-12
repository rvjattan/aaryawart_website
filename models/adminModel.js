const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createAdmin({ username, email, password, role }) {
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO admins (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, password_hash, role]
  );
  return { id: result.insertId, username, email, role };
}

async function updateAdminPassword(username, password) {
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'UPDATE admins SET password_hash = ? WHERE username = ?',
    [password_hash, username]
  );
  return result.affectedRows > 0;
}

async function updateAdminPasswordById(id, password) {
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'UPDATE admins SET password_hash = ? WHERE id = ?',
    [password_hash, id]
  );
  return result.affectedRows > 0;
}

async function listAdmins() {
  const [rows] = await pool.query(
    'SELECT id, username, email, role, created_at FROM admins ORDER BY created_at DESC'
  );
  return rows;
}

async function updateAdminRole(id, role) {
  await pool.query('UPDATE admins SET role = ? WHERE id = ?', [role, id]);
}

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  createAdmin,
  updateAdminPassword,
  updateAdminPasswordById,
  listAdmins,
  updateAdminRole,
};

