#!/usr/bin/env node
require('dotenv').config();
const pool = require('../config/db');

async function deleteAdmin() {
  try {
    const [result] = await pool.query('DELETE FROM admins WHERE email = ?', ['admin@example.com']);
    console.log(`Deleted ${result.affectedRows} admin record(s)`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

deleteAdmin();
