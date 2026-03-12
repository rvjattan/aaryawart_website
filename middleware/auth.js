const jwt = require('jsonwebtoken');

function generateToken(admin) {
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

