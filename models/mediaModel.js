const pool = require('../config/db');

async function createMedia({ filename, file_path, file_type, uploaded_by }) {
  const [result] = await pool.query(
    `INSERT INTO media (filename, file_path, file_type, uploaded_by)
     VALUES (?, ?, ?, ?)`,
    [filename, file_path, file_type, uploaded_by || null]
  );
  return { id: result.insertId, filename, file_path, file_type, uploaded_by };
}

async function getMedia({ page = 1, limit = 30, type }) {
  const offset = (page - 1) * limit;
  const filters = [];
  const params = [];

  if (type) {
    filters.push('file_type LIKE ?');
    params.push(`${type}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM media ${whereClause} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM media ${whereClause}`,
    params
  );

  return {
    data: rows,
    total: countRows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
}

async function deleteMedia(id) {
  await pool.query('DELETE FROM media WHERE id = ?', [id]);
}

module.exports = {
  createMedia,
  getMedia,
  deleteMedia,
};

