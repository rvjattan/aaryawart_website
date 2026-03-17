const pool = require('../config/db');

async function getSetting(key, defaultValue = null) {
  const [rows] = await pool.query(
    'SELECT settings_value FROM site_settings WHERE settings_key = ?',
    [key]
  );
  if (!rows[0]) return defaultValue;
  return rows[0].settings_value;
}

async function getSettings(keysWithDefaults = {}) {
  const keys = Object.keys(keysWithDefaults);
  if (!keys.length) return {};

  const placeholders = keys.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT settings_key, settings_value FROM site_settings WHERE settings_key IN (${placeholders})`,
    keys
  );

  const map = { ...keysWithDefaults };
  rows.forEach((row) => {
    map[row.settings_key] = row.settings_value;
  });
  return map;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO site_settings (settings_key, settings_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value)`,
    [key, value]
  );
}

async function setSettings(obj) {
  const entries = Object.entries(obj);
  if (!entries.length) return;
  const values = [];
  const placeholders = entries
    .map(() => '(?, ?)')
    .join(',');
  entries.forEach(([k, v]) => {
    values.push(k, v);
  });
  await pool.query(
    `INSERT INTO site_settings (settings_key, settings_value)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value)`,
    values
  );
}

module.exports = {
  getSetting,
  getSettings,
  setSetting,
  setSettings,
};

