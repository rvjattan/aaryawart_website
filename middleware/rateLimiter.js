const rateLimit = require('express-rate-limit');

// Rate limiter for admin login (strict: 5 attempts per 15 minutes)
// Prevents brute force password guessing attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for GET requests (only limit POST)
    return req.method !== 'POST';
  },
});

// Rate limiter for volunteer registration (moderate: 10 per hour)
// Prevents spam registrations while allowing legitimate users
const volunteerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  message: 'Too many volunteer registrations from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for testimonials (moderate: 15 per hour)
// Prevents testimonial spam while allowing legitimate submissions
const testimonialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // 15 requests per hour per IP
  message: 'Too many testimonial submissions from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for donation order creation (generous: 20 per hour)
// Allows multiple donation attempts while preventing abuse
const donationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour per IP
  message: 'Too many donation requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  volunteerLimiter,
  testimonialLimiter,
  donationLimiter,
};
