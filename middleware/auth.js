const jwt = require('jsonwebtoken');

function generateToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Set it in environment variables.');
  }
  return jwt.sign(
    { id: admin.id, role: admin.role, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function authRequired(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.redirect('/admin/login');
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in production. Cannot verify token.');
    return res.status(500).send('Server authentication not configured.');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/admin/login');
  }
}

function roleRequired(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/admin/login');
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).send('Forbidden');
    }
    next();
  };
}

module.exports = {
  generateToken,
  authRequired,
  roleRequired,
};

