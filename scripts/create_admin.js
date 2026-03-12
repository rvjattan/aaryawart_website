#!/usr/bin/env node
require('dotenv').config();
const adminModel = require('../models/adminModel');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((a) => {
    const m = a.match(/^--([a-zA-Z0-9_\-]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  });
  return args;
}

async function main() {
  const args = parseArgs();
  const username = args.username || process.env.ADMIN_USER || 'superadmin';
  const email = args.email || process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = args.password || process.env.ADMIN_PASSWORD || 'admin123';
  const role = args.role || process.env.ADMIN_ROLE || 'SUPER_ADMIN';
  const reset = args.reset === 'true' || args.reset === '1' || process.argv.includes('--reset');

  try {
    let existing = await adminModel.findByUsername(username);
    if (!existing && (reset || process.env.ADMIN_EMAIL)) {
      existing = await adminModel.findByEmail(email);
    }
    if (existing) {
      if (reset && (adminModel.updateAdminPassword || adminModel.updateAdminPasswordById)) {
        if (adminModel.updateAdminPasswordById) {
          await adminModel.updateAdminPasswordById(existing.id, password);
        } else {
          await adminModel.updateAdminPassword(existing.username, password);
        }
        console.log(`Password updated for admin '${existing.username}' (${existing.email}).`);
        console.log(`Login at /admin/login with username='${existing.username}' and your new password.`);
      } else {
        console.log(`Admin user '${existing.username}' already exists (id=${existing.id}).`);
        console.log('To reset the password, run: node scripts/create_admin.js --reset --password=yourNewPassword');
      }
      process.exit(0);
      return;
    }
    const created = await adminModel.createAdmin({ username, email, password, role });
    console.log('Created admin:', created);
    console.log(`Login at /admin/login with username='${username}' and the password you provided.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
