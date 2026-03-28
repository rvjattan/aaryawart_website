const csrf = require('csurf');

// CSRF protection middleware using synchronous token validation
// Tokens are stored in session/cookie and validated on POST/PUT/DELETE
const csrfProtection = csrf({
  cookie: true, // Store CSRF token in cookie for stateless verification
  httpOnly: false, // Allow JavaScript to read for AJAX requests
});

// Middleware to pass CSRF token to all views
const csrfTokenMiddleware = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = {
  csrfProtection,
  csrfTokenMiddleware,
};
