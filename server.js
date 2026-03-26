require('dotenv').config();
console.log('DB_PASSWORD from env:', process.env.DB_PASSWORD);
console.log('DB_USER from env:', process.env.DB_USER);

// ... rest of your server.js code
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const blogModel = require('./models/blogModel');
const statsModel = require('./models/statsModel');
const siteSettingsModel = require('./models/siteSettingsModel');
const contentModel = require('./models/contentModel');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security & logging
// Configure CSP to allow Bootstrap and Bootstrap Icons from jsdelivr CDN
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));
app.use(morgan('dev'));

// Parsers
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Global site settings (header, footer, ticker) available to all views
app.use(async (req, res, next) => {
  try {
    const defaults = {
      site_name: 'Aaryawart Seva Nyaas',
      site_tagline: 'Seva | Shiksha | Sahyog',
      header_logo_url: '/static/images/logo.png',
      news_ticker_text:
        'Upcoming health camp in rural districts • National youth leadership workshop • Flood relief volunteer deployment • New education centers inaugurated',
      footer_about:
        'A nationwide social and cultural organization dedicated to selfless service, character building, and national integration through thousands of volunteers and grassroots projects.',
      footer_contact:
        '113, Shivalik Nagar, BHEL, Haridwar, UK, India (249403)\nEmail: aaryawartsevanyaas@gmail.com\nPhone: +91-9253999082, 9253999083',
      footer_quick_links_json: JSON.stringify([
        { label: 'About Us', url: '/about' },
        { label: 'Activities', url: '/activities' },
        { label: 'Media', url: '/media' },
        { label: 'Volunteer / Donate', url: '/get-involved' },
        { label: 'Contact', url: '/contact' },
      ]),
      social_links_json: JSON.stringify([
        {
          id: 'facebook',
          icon: 'bi-facebook',
          url: 'https://www.facebook.com/people/Aaryawart-Seva-Nyaas/61585981201970/',
        },
        {
          id: 'twitter',
          icon: 'bi-twitter-x',
          url: 'https://x.com/aaryawartastro',
        },
        {
          id: 'instagram',
          icon: 'bi-instagram',
          url: 'https://www.instagram.com/aaryawart_seva_nyaas/',
        },
        {
          id: 'youtube',
          icon: 'bi-youtube',
          url: 'https://www.youtube.com/@aaryawartastroworld',
        },
        { id: 'linkedin', icon: 'bi-linkedin', url: 'https://linkedin.com' },
      ]),
    };
    res.locals.settings = await siteSettingsModel.getSettings(defaults);
  } catch (e) {
    res.locals.settings = null;
  }
  next();
});

// Simple analytics: count page views for public pages
app.use(async (req, res, next) => {
  try {
    if (!req.path.startsWith('/admin') && !req.path.startsWith('/api')) {
      await statsModel.incrementCounter('page_views_total', 1);
    }
  } catch (e) {
    // ignore analytics errors
  }
  next();
});

// Public pages
app.get('/', async (req, res, next) => {
  try {
    const results = await Promise.allSettled([
      blogModel.getBlogs({ page: 1, limit: 3, status: 'PUBLISHED' }),
      statsModel.getMany([
        'volunteers_registered',
        'projects_completed',
        'lives_impacted',
      ]),
      contentModel.getBlocks('home', 'hero'),
      contentModel.getBlocks('home', 'mission'),
      contentModel.getBlocks('home', 'vision'),
      contentModel.getBlocks('home', 'approach'),
      contentModel.getBlocks('home', 'testimonials'),
    ]);

    const getValue = (result, fallback) =>
      result.status === 'fulfilled' ? result.value : fallback;

    const latestBlogs = getValue(results[0], { data: [] });
    const stats       = getValue(results[1], {});
    const heroBlocks  = getValue(results[2], []);
    const missionBlocks = getValue(results[3], []);
    const visionBlocks  = getValue(results[4], []);
    const approachBlocks = getValue(results[5], []);
    const testimonialBlocks = getValue(results[6], []);

    // Log DB errors for debugging without crashing the page
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`Homepage DB query [${i}] failed:`, r.reason && r.reason.message);
      }
    });

    res.render('public/home', {
      title: 'Home',
      latestBlogs: latestBlogs.data || [],
      stats,
      hero: heroBlocks[0] || null,
      mission: missionBlocks[0] || null,
      vision: visionBlocks[0] || null,
      approach: approachBlocks[0] || null,
      testimonials: testimonialBlocks,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/about', (req, res) => {
  res.render('public/about', { title: 'About Us' });
});

app.get('/activities', (req, res) => {
  res.render('public/activities', { title: 'Activities & Programs' });
});

app.get('/media', (req, res) => {
  res.render('public/media', { title: 'Media & Publications' });
});

app.get('/get-involved', (req, res) => {
  res.render('public/get-involved', { title: 'Get Involved', submitted: false });
});

app.post('/get-involved', (req, res) => {
  // Handled via AJAX in the frontend; fallback message
  res.render('public/get-involved', {
    title: 'Get Involved',
    submitted: true,
  });
});

app.get('/contact', (req, res) => {
  res.render('public/contact', { title: 'Contact & Locations', submitted: false });
});

app.get('/testimonials', (req, res) => {
  res.render('public/testimonials', { title: 'Testimonials', submitted: false });
});

// API routes
app.use('/api', apiRoutes);

// Admin routes
app.use('/admin', adminRoutes);

// 404
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  res.status(404).render('public/404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  } else {
    res.status(500).render('public/500', { title: 'Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

