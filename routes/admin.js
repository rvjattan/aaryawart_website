const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateToken, authRequired, roleRequired } = require('../middleware/auth');
const { findByUsername, listAdmins, updateAdminRole } = require('../models/adminModel');
const volunteerModel = require('../models/volunteerModel');
const blogModel = require('../models/blogModel');
const mediaModel = require('../models/mediaModel');

const router = express.Router();

// Multer setup for uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Admin auth views
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await findByUsername(username);
  if (!admin) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials' });
  }
  const token = generateToken(admin);
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin/login');
});

// Protect all routes below
router.use(authRequired);

// Dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const volunteers = await volunteerModel.getVolunteers({ page: 1, limit: 5 });
    const blogs = await blogModel.getBlogs({ page: 1, limit: 5, status: 'PUBLISHED' });
    res.render('admin/dashboard', {
      title: 'Dashboard',
      user: req.user,
      stats: {
        totalVolunteers: volunteers.total,
        totalBlogs: blogs.total,
      },
      recentVolunteers: volunteers.data,
      recentBlogs: blogs.data,
    });
  } catch (err) {
    next(err);
  }
});

// Volunteer management
router.get('/volunteers', async (req, res, next) => {
  try {
    const { page = 1, state, city, search } = req.query;
    const result = await volunteerModel.getVolunteers({
      page,
      limit: 20,
      state,
      city,
      search,
    });
    res.render('admin/volunteers/index', {
      title: 'Volunteers',
      user: req.user,
      ...result,
      filters: { state, city, search },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/volunteers/:id', async (req, res, next) => {
  try {
    const volunteer = await volunteerModel.getVolunteerById(req.params.id);
    if (!volunteer) return res.status(404).send('Not found');
    res.render('admin/volunteers/show', {
      title: 'Volunteer Detail',
      user: req.user,
      volunteer,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/volunteers/:id/delete', roleRequired(['SUPER_ADMIN', 'MODERATOR']), async (req, res, next) => {
  try {
    await volunteerModel.deleteVolunteer(req.params.id);
    res.redirect('/admin/volunteers');
  } catch (err) {
    next(err);
  }
});

// Export volunteers to CSV
router.get('/volunteers/export/csv', roleRequired(['SUPER_ADMIN', 'EDITOR']), async (req, res, next) => {
  try {
    const { state, city, search } = req.query;
    const result = await volunteerModel.getVolunteers({
      page: 1,
      limit: 10000,
      state,
      city,
      search,
    });
    const volunteers = result.data;

    // Build CSV
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'State', 'City', 'Skills', 'Availability', 'Registered Date'];
    const rows = volunteers.map(v => [
      v.id,
      `"${v.name.replace(/"/g, '""')}"`,
      v.email,
      v.phone,
      `"${(v.address || '').replace(/"/g, '""')}"`,
      v.state || '',
      v.city || '',
      `"${(v.skills || '').replace(/"/g, '""')}"`,
      `"${(v.availability || '').replace(/"/g, '""')}"`,
      new Date(v.registered_date).toLocaleDateString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="volunteers-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// Blog management
router.get('/blogs', async (req, res, next) => {
  try {
    const { page = 1, status } = req.query;
    const result = await blogModel.getBlogs({
      page,
      limit: 20,
      status: status || undefined,
    });
    res.render('admin/blogs/index', {
      title: 'Blogs',
      user: req.user,
      ...result,
      filters: { status },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/blogs/new', roleRequired(['SUPER_ADMIN', 'EDITOR']), (req, res) => {
  res.render('admin/blogs/form', {
    title: 'New Blog Post',
    user: req.user,
    post: {},
    mode: 'create',
  });
});

router.post(
  '/blogs',
  roleRequired(['SUPER_ADMIN', 'EDITOR']),
  upload.single('featured_image'),
  async (req, res, next) => {
    try {
      const featured_image = req.file ? `/uploads/${req.file.filename}` : null;
      const { title, category, content, author, publish_date, status } = req.body;
      await blogModel.createBlog({
        title,
        featured_image,
        category,
        content,
        author,
        publish_date,
        status,
      });
      res.redirect('/admin/blogs');
    } catch (err) {
      next(err);
    }
  }
);

router.get('/blogs/:id/edit', roleRequired(['SUPER_ADMIN', 'EDITOR']), async (req, res, next) => {
  try {
    const post = await blogModel.getBlogById(req.params.id);
    if (!post) return res.status(404).send('Not found');
    res.render('admin/blogs/form', {
      title: 'Edit Blog Post',
      user: req.user,
      post,
      mode: 'edit',
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/blogs/:id',
  roleRequired(['SUPER_ADMIN', 'EDITOR']),
  upload.single('featured_image'),
  async (req, res, next) => {
    try {
      const existing = await blogModel.getBlogById(req.params.id);
      if (!existing) return res.status(404).send('Not found');

      const featured_image = req.file
        ? `/uploads/${req.file.filename}`
        : existing.featured_image;

      const { title, category, content, author, publish_date, status } = req.body;
      await blogModel.updateBlog(req.params.id, {
        title,
        category,
        content,
        author,
        publish_date,
        status,
        featured_image,
      });
      res.redirect('/admin/blogs');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/blogs/:id/delete',
  roleRequired(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      await blogModel.deleteBlog(req.params.id);
      res.redirect('/admin/blogs');
    } catch (err) {
      next(err);
    }
  }
);

// Media library
router.get('/media', async (req, res, next) => {
  try {
    const { page = 1, type } = req.query;
    const result = await mediaModel.getMedia({ page, limit: 40, type });
    res.render('admin/media/index', {
      title: 'Media Library',
      user: req.user,
      ...result,
      filters: { type },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/media/upload',
  upload.array('files', 10),
  async (req, res, next) => {
    try {
      const saved = [];
      for (const file of req.files) {
        const media = await mediaModel.createMedia({
          filename: file.originalname,
          file_path: `/uploads/${file.filename}`,
          file_type: file.mimetype,
          uploaded_by: req.user.id,
        });
        saved.push(media);
      }
      res.redirect('/admin/media');
    } catch (err) {
      next(err);
    }
  }
);

router.post('/media/:id/delete', async (req, res, next) => {
  try {
    await mediaModel.deleteMedia(req.params.id);
    res.redirect('/admin/media');
  } catch (err) {
    next(err);
  }
});

// Email notification system
const nodemailer = require('nodemailer');
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

router.get('/emails', roleRequired(['SUPER_ADMIN', 'EDITOR']), (req, res) => {
  res.render('admin/emails/index', {
    title: 'Email Volunteers',
    user: req.user,
    message: null,
    error: null,
  });
});

router.post('/emails', roleRequired(['SUPER_ADMIN', 'EDITOR']), async (req, res, next) => {
  try {
    const { subject, body, state } = req.body;
    const all = await volunteerModel.getVolunteers({
      page: 1,
      limit: 10000,
      state: state || undefined,
    });
    const recipients = all.data.map((v) => v.email).filter(Boolean);
    if (!recipients.length) {
      return res.render('admin/emails/index', {
        title: 'Email Volunteers',
        user: req.user,
        message: null,
        error: 'No volunteers found for the selected filter.',
      });
    }

    if (!process.env.SMTP_HOST) {
      return res.render('admin/emails/index', {
        title: 'Email Volunteers',
        user: req.user,
        message: null,
        error: 'SMTP is not configured on the server.',
      });
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL,
      bcc: recipients,
      subject,
      text: body,
    };
    await transporter.sendMail(mailOptions);

    res.render('admin/emails/index', {
      title: 'Email Volunteers',
      user: req.user,
      message: `Email sent to ${recipients.length} volunteers.`,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// User role management (Super Admin only)
router.get('/users', roleRequired(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const admins = await listAdmins();
    res.render('admin/users/index', {
      title: 'User Management',
      user: req.user,
      admins,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users/:id/role', roleRequired(['SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { role } = req.body;
    await updateAdminRole(req.params.id, role);
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

