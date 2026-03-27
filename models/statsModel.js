const pool = require('../config/db');

async function incrementCounter(key, amount = 1) {
  try {
    await pool.query(
      `INSERT INTO stats_counters (key_name, value)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = value + VALUES(value)`,
      [key, amount]
    );
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('stats_counters table not found. Skipping counter increment', key);
      return false;
    }
    throw err;
  }
}

async function getCounter(key) {
  try {
    const [rows] = await pool.query(
      'SELECT value FROM stats_counters WHERE key_name = ?',
      [key]
    );
    return rows[0] ? rows[0].value : 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('stats_counters table not found. Returning default 0 for', key);
      return 0;
    }
    throw err;
  }
}

async function getMany(keys) {
  if (!keys.length) return {};
  try {
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
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('stats_counters table not found. Returning 0 for all keys', keys);
      const map = {};
      keys.forEach((k) => {
        map[k] = 0;
      });
      return map;
    }
    throw err;
  }
}

module.exports = {
  incrementCounter,
  getCounter,
  getMany,
};

