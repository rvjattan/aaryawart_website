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

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security & logging
app.use(helmet());
app.use(morgan('dev'));

// Parsers
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Load site settings and make available globally
app.use(async (req, res, next) => {
  try {
    if (!app.locals.siteSettings) {
      app.locals.siteSettings = await siteSettingsModel.getAllSettings();
    }
    // Make settings available to all views
    res.locals.siteSettings = app.locals.siteSettings;
  } catch (e) {
    console.error('Error loading site settings:', e);
    res.locals.siteSettings = {};
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
    const [latestBlogs, stats] = await Promise.all([
      blogModel.getBlogs({ page: 1, limit: 3, status: 'PUBLISHED' }),
      statsModel.getMany([
        'volunteers_registered',
        'projects_completed',
        'lives_impacted',
      ]),
    ]);
    res.render('public/home', {
      title: 'Home',
      latestBlogs: latestBlogs.data,
      stats,
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

