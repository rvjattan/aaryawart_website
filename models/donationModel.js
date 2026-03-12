const pool = require('../config/db');

/**
 * Insert a donation record after payment verification.
 * amount_paise: amount in paise (e.g. 50000 = ₹500)
 */
async function createDonation({
  donor_name,
  donor_email,
  amount_paise,
  currency,
  razorpay_order_id,
  razorpay_payment_id,
  status = 'captured',
}) {
  const [result] = await pool.query(
    `INSERT INTO donations (donor_name, donor_email, amount_paise, currency, razorpay_order_id, razorpay_payment_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      donor_name,
      donor_email,
      amount_paise,
      currency || 'INR',
      razorpay_order_id,
      razorpay_payment_id,
      status,
    ]
  );
  return result.insertId;
}

async function getDonations({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    'SELECT id, donor_name, donor_email, amount_paise, currency, razorpay_order_id, razorpay_payment_id, status, created_at FROM donations ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM donations');
  return { data: rows, total: total || 0 };
}

async function getDonationByOrderId(razorpay_order_id) {
  const [rows] = await pool.query('SELECT id FROM donations WHERE razorpay_order_id = ?', [razorpay_order_id]);
  return rows[0] || null;
}

module.exports = {
  createDonation,
  getDonations,
  getDonationByOrderId,
};
