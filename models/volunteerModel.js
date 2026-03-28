const pool = require('../config/db');

async function createVolunteer(data) {
  const {
    name,
    email,
    phone,
    address,
    state,
    city,
    skills,
    availability,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO volunteers 
    (name, email, phone, address, state, city, skills, availability, registered_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [name, email, phone, address, state, city, skills, availability]
  );

  return { id: result.insertId, ...data };
}

async function getVolunteers({ page = 1, limit = 20, state, city, search }) {
  const offset = (page - 1) * limit;
  const filters = [];
  const params = [];

  if (state) {
    filters.push('state = ?');
    params.push(state);
  }
  if (city) {
    filters.push('city = ?');
    params.push(city);
  }
  if (search) {
    // ✅ Escape SQL wildcard characters to prevent injection
    const escapedSearch = String(search).replace(/[%_\\]/g, '\\$&');
    filters.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${escapedSearch}%`, `%${escapedSearch}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM volunteers ${whereClause} ORDER BY registered_date DESC LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM volunteers ${whereClause}`,
    params
  );

  return {
    data: rows,
    total: countRows[0].total,
    page: Number(page),
    limit: Number(limit),
  };
}

async function getVolunteerById(id) {
  const [rows] = await pool.query('SELECT * FROM volunteers WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateVolunteer(id, data) {
  // ✅ Whitelist of allowed updatable fields to prevent object injection
  const ALLOWED_FIELDS = ['name', 'email', 'phone', 'address', 'state', 'city', 'skills', 'availability'];
  
  const fields = [];
  const params = [];

  // Only allow updating whitelisted fields
  Object.entries(data).forEach(([key, value]) => {
    if (ALLOWED_FIELDS.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (!fields.length) return;

  params.push(id);
  await pool.query(`UPDATE volunteers SET ${fields.join(', ')} WHERE id = ?`, params);
}

async function deleteVolunteer(id) {
  await pool.query('DELETE FROM volunteers WHERE id = ?', [id]);
}

module.exports = {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
};

