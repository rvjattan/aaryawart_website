const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { createVolunteer } = require('../models/volunteerModel');
const { getBlogs, getBlogById } = require('../models/blogModel');
const statsModel = require('../models/statsModel');
const donationModel = require('../models/donationModel');
const testimonialModel = require('../models/testimonialModel');
const nodemailer = require('nodemailer');

const Razorpay = require('razorpay');

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Email transporter (for volunteer confirmations and notifications)
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// Validation functions for volunteer registration
function validateVolunteerData(data) {
  const errors = {};

  // Validate name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = 'Valid email address is required';
  }

  // Validate phone
  const digitsOnly = (data.phone || '').replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    errors.phone = 'Mobile number must have at least 10 digits';
  } else {
    const firstDigit = parseInt(digitsOnly[0]);
    if (firstDigit <= 5) {
      errors.phone = 'Mobile number cannot start with 0, 1, 2, 3, 4, or 5';
    }
  }

  // Validate state
  if (!data.state || !data.state.trim()) {
    errors.state = 'State is required';
  }

  // Validate city
  if (!data.city || !data.city.trim()) {
    errors.city = 'City is required';
  }

  return errors;
}

// Public API: create volunteer (from Get Involved form)
router.post('/volunteers', async (req, res, next) => {
  try {
    // Validate input data
    const validationErrors = validateVolunteerData(req.body);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    const volunteer = await createVolunteer(req.body);

    try {
      await statsModel.incrementCounter('volunteers_registered', 1);
    } catch (metricErr) {
      console.warn('[createVolunteer] stats increment failed', metricErr.message);
      // continue without failing the request
    }

    // Send confirmation email (best-effort, errors ignored)
    if (process.env.SMTP_HOST && volunteer.email) {
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to: volunteer.email,
        subject: 'Thank you for registering as a volunteer',
        text:
          `Dear ${volunteer.name},\n\n` +
          'Thank you for registering as a volunteer with our organization. We will contact you soon with opportunities.\n\n' +
          'Warm regards,\n' +
          'Social & Charity Organization',
      };
      transporter.sendMail(mailOptions).catch(() => {});
    }

    res.status(201).json({ success: true, data: volunteer });
  } catch (err) {
    next(err);
  }
});

// Public API: list blogs (for frontend listing, with pagination & filters)
router.get('/blogs', async (req, res, next) => {
  try {
    const result = await getBlogs({
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      status: 'PUBLISHED',
      category: req.query.category,
      search: req.query.search,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Public API: blog detail
router.get('/blogs/:id', async (req, res, next) => {
  try {
    const blog = await getBlogById(req.params.id);
    if (!blog || blog.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
});

// Public API: simple stats for impact counters
router.get('/stats', async (req, res, next) => {
  try {
    const keys = [
      'volunteers_registered',
      'projects_completed',
      'lives_impacted',
      'page_views_total',
    ];
    const values = await statsModel.getMany(keys);
    res.json({ success: true, data: values });
  } catch (err) {
    next(err);
  }
});

// --- Donations (Razorpay) ---

// Create Razorpay order for donation
router.post('/donate/create-order', async (req, res, next) => {
  try {
    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
    }
    const { amount_paise, donor_name, donor_email } = req.body;
    const amount = Math.round(Number(amount_paise)) || 0;
    const minPaise = 100; // ₹1 minimum
    if (amount < minPaise) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }
    const name = String(donor_name || '').trim() || 'Donor';
    const email = String(donor_email || '').trim() || '';

    const order = await instance.orders.create({
      amount,
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      notes: { donor_name: name, donor_email: email },
    });

    res.status(201).json({
      success: true,
      order_id: order.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount_paise: amount,
      currency: 'INR',
    });
  } catch (err) {
    next(err);
  }
});

// Verify Razorpay payment and record donation
router.post('/donate/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(503).json({ success: false, message: 'Payment gateway is not configured.' });
    }

    const order = await instance.orders.fetch(razorpay_order_id);
    const amount_paise = order.amount;
    const notes = order.notes || {};
    const donor_name = notes.donor_name || 'Donor';
    const donor_email = notes.donor_email || '';

    const existing = await donationModel.getDonationByOrderId(razorpay_order_id);
    if (existing) {
      return res.json({ success: true, message: 'Thank you for your donation!' });
    }

    await donationModel.createDonation({
      donor_name,
      donor_email,
      amount_paise,
      currency: order.currency || 'INR',
      razorpay_order_id,
      razorpay_payment_id,
      status: 'captured',
    });

    res.json({ success: true, message: 'Thank you for your donation!' });
  } catch (err) {
    next(err);
  }
});

// Public API: submit testimonial
router.post('/testimonials', async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }
    
    const testimonial = await testimonialModel.createTestimonial(name, email, message);
    res.status(201).json({ success: true, data: testimonial, message: 'Thank you for your testimonial! It will be displayed after approval.' });
  } catch (err) {
    console.error('[POST /api/testimonials] Error creating testimonial:', {
      error: err.message,
      code: err.code,
      body: req.body
    });
    next(err);
  }
});

// Public API: get approved testimonials
router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await testimonialModel.getApprovedTestimonials();
    res.json({ success: true, data: testimonials });
  } catch (err) {
    next(err);
  }
});

// Diagnostic endpoint - test database connection (remove in production)
router.get('/health/db', async (req, res) => {
  try {
    const [result] = await require('../config/db').query('SELECT 1 as connected');
    res.json({ 
      success: true, 
      message: 'Database connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

