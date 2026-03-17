const pool = require('../config/db');

// Get all settings as an object
const getAllSettings = async () => {
  const [rows] = await pool.query(
    'SELECT setting_key, setting_value, setting_type FROM site_settings'
  );
  
  const settings = {};
  rows.forEach(row => {
    if (row.setting_type === 'number') {
      settings[row.setting_key] = parseInt(row.setting_value, 10);
    } else if (row.setting_type === 'json') {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        settings[row.setting_key] = row.setting_value;
      }
    } else {
      settings[row.setting_key] = row.setting_value;
    }
  });
  
  return settings;
};

// Get a single setting
const getSetting = async (key) => {
  const [rows] = await pool.query(
    'SELECT setting_value, setting_type FROM site_settings WHERE setting_key = ?',
    [key]
  );
  
  if (rows.length === 0) return null;
  
  const row = rows[0];
  if (row.setting_type === 'number') {
    return parseInt(row.setting_value, 10);
  } else if (row.setting_type === 'json') {
    try {
      return JSON.parse(row.setting_value);
    } catch {
      return row.setting_value;
    }
  }
  return row.setting_value;
};

// Get all settings with metadata for the admin panel
const getSettingsWithMetadata = async () => {
  const [rows] = await pool.query(
    'SELECT setting_key, setting_value, setting_type, description FROM site_settings ORDER BY setting_key'
  );
  return rows;
};

// Update a setting
const updateSetting = async (key, value) => {
  const [result] = await pool.query(
    'UPDATE site_settings SET setting_value = ? WHERE setting_key = ?',
    [value, key]
  );
  return result.affectedRows > 0;
};

// Update multiple settings at once
const updateSettings = async (updates) => {
  const promises = Object.entries(updates).map(([key, value]) =>
    updateSetting(key, String(value))
  );
  await Promise.all(promises);
  return true;
};

// Create a new setting
const createSetting = async (key, value, type = 'text', description = '') => {
  const [result] = await pool.query(
    'INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)',
    [key, value, type, description]
  );
  return result.insertId;
};

module.exports = {
  getAllSettings,
  getSetting,
  getSettingsWithMetadata,
  updateSetting,
  updateSettings,
  createSetting,
};
