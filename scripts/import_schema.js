#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('Importing schema...');
    await connection.query(schema);
    console.log('✓ Schema imported successfully!');
  } catch (err) {
    console.error('✗ Error importing schema:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
