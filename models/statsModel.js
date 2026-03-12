const pool = require('../config/db');

async function incrementCounter(key, amount = 1) {
  await pool.query(
    `INSERT INTO stats_counters (key_name, value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = value + VALUES(value)`,
    [key, amount]
  );
}

async function getCounter(key) {
  const [rows] = await pool.query(
    'SELECT value FROM stats_counters WHERE key_name = ?',
    [key]
  );
  return rows[0] ? rows[0].value : 0;
}

async function getMany(keys) {
  if (!keys.length) return {};
  const [rows] = await pool.query(
    `SELECT key_name, value FROM stats_counters WHERE key_name IN (${keys
      .map(() => '?')
      .join(',')})`,
    keys
  );
  const map = {};
  rows.forEach((r) => {
    map[r.key_name] = r.value;
  });
  keys.forEach((k) => {
    if (map[k] === undefined) map[k] = 0;
  });
  return map;
}

module.exports = {
  incrementCounter,
  getCounter,
  getMany,
};

