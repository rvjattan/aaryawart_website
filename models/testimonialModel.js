const pool = require('../config/db');

async function createTestimonial(name, email, message) {
  try {
    const [result] = await pool.query(
      `INSERT INTO testimonials (name, email, message, is_approved)
       VALUES (?, ?, ?, FALSE)`,
      [name, email, message]
    );
    return { id: result.insertId, name, email, message, is_approved: false };
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.error('Testimonials table does not exist. Please run the schema migration.');
    }
    throw err;
  }
}

async function getTestimonials(filters = {}) {
  try {
    const { isApproved = null, page = 1, limit = 20, sortBy = 'submitted_at', order = 'DESC' } = filters;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, name, email, message, is_approved, submitted_at FROM testimonials WHERE 1=1';
    let params = [];
    
    if (isApproved !== null) {
      query += ' AND is_approved = ?';
      params.push(isApproved);
    }
    
    // Validate sortBy to prevent SQL injection
    const allowedSorts = ['submitted_at', 'name', 'id'];
    const validSort = allowedSorts.includes(sortBy) ? sortBy : 'submitted_at';
    const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${validSort} ${validOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM testimonials WHERE 1=1';
    let countParams = [];
    
    if (isApproved !== null) {
      countQuery += ' AND is_approved = ?';
      countParams.push(isApproved);
    }
    
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      data: rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      return { data: [], total: 0, page: 1, limit, pages: 0 };
    }
    throw err;
  }
}

async function getTestimonialById(id) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, message, is_approved, submitted_at FROM testimonials WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return null;
    throw err;
  }
}

async function approveTestimonial(id) {
  try {
    const [result] = await pool.query(
      'UPDATE testimonials SET is_approved = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return false;
    throw err;
  }
}

async function rejectTestimonial(id) {
  try {
    const [result] = await pool.query(
      'UPDATE testimonials SET is_approved = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return false;
    throw err;
  }
}

async function deleteTestimonial(id) {
  try {
    const [result] = await pool.query(
      'DELETE FROM testimonials WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return false;
    throw err;
  }
}

async function getApprovedTestimonials() {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, message, submitted_at FROM testimonials WHERE is_approved = TRUE ORDER BY submitted_at DESC'
    );
    return rows;
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') return [];
    throw err;
  }
}

module.exports = {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  approveTestimonial,
  rejectTestimonial,
  deleteTestimonial,
  getApprovedTestimonials,
};
