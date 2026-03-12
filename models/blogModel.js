const pool = require('../config/db');

async function createBlog(post) {
  const {
    title,
    featured_image,
    category,
    content,
    author,
    publish_date,
    status,
  } = post;

  const [result] = await pool.query(
    `INSERT INTO blogs 
    (title, featured_image, category, content, author, publish_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, featured_image, category, content, author, publish_date, status]
  );

  return { id: result.insertId, ...post };
}

async function updateBlog(id, post) {
  const fields = [];
  const params = [];

  Object.entries(post).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (!fields.length) return;

  params.push(id);
  await pool.query(`UPDATE blogs SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function deleteBlog(id) {
  await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
}

async function getBlogById(id) {
  const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
  return rows[0] || null;
}

async function getBlogs({ page = 1, limit = 10, status = 'PUBLISHED', category, search }) {
  const offset = (page - 1) * limit;
  const filters = [];
  const params = [];

  if (status) {
    filters.push('status = ?');
    params.push(status);
  }
  if (category) {
    filters.push('category = ?');
    params.push(category);
  }
  if (search) {
    filters.push('title LIKE ?');
    params.push(`%${search}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM blogs ${whereClause} ORDER BY publish_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM blogs ${whereClause}`,
    params
  );

  return {
    data: rows,
    total: countRows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
}

module.exports = {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
};

