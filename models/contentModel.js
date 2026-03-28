const pool = require('../config/db');

async function getBlocks(page, section) {
  try {
    const [rows] = await pool.query(
      `SELECT id, page, section, title, body, extra_json, sort_order
       FROM content_blocks
       WHERE page = ? AND section = ?
       ORDER BY sort_order ASC, id ASC`,
      [page, section]
    );
    return rows;
  } catch (err) {
    // Allow app to run even if migrations not applied yet
    if (err && err.code === 'ER_NO_SUCH_TABLE') return [];
    throw err;
  }
}

async function getBlocksForPage(page) {
  try {
    const [rows] = await pool.query(
      `SELECT id, page, section, title, body, extra_json, sort_order
       FROM content_blocks
       WHERE page = ?
       ORDER BY section ASC, sort_order ASC, id ASC`,
      [page]
    );
    return rows;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return [];
    throw err;
  }
}

async function getBlockById(id) {
  try {
    const [rows] = await pool.query(
      `SELECT id, page, section, title, body, extra_json, sort_order
       FROM content_blocks
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return null;
    throw err;
  }
}

async function createBlock({ page, section, title, body, extra_json, sort_order = 0 }) {
  const [result] = await pool.query(
    `INSERT INTO content_blocks (page, section, title, body, extra_json, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [page, section, title, body || '', extra_json || null, sort_order]
  );
  return { id: result.insertId, page, section, title, body, extra_json, sort_order };
}

async function updateBlock(id, { title, body, extra_json, sort_order }) {
  const fields = [];
  const params = [];
  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title);
  }
  if (body !== undefined) {
    fields.push('body = ?');
    params.push(body);
  }
  if (extra_json !== undefined) {
    fields.push('extra_json = ?');
    params.push(extra_json);
  }
  if (sort_order !== undefined) {
    // ✅ Validate sort_order is a positive integer to prevent injection
    const sortOrderNum = parseInt(sort_order);
    if (isNaN(sortOrderNum) || sortOrderNum < 0) {
      throw new Error('Invalid sort_order value');
    }
    fields.push('sort_order = ?');
    params.push(sortOrderNum);
  }
  if (!fields.length) return;
  params.push(id);
  await pool.query(
    `UPDATE content_blocks SET ${fields.join(', ')} WHERE id = ?`,
    params
  );
}

async function deleteBlock(id) {
  await pool.query('DELETE FROM content_blocks WHERE id = ?', [id]);
}

module.exports = {
  getBlocks,
  getBlocksForPage,
  getBlockById,
  createBlock,
  updateBlock,
  deleteBlock,
};

