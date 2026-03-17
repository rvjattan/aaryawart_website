#  Aaryawart Seva Nyaas Website

Full-stack website, including a public-facing site and an admin panel for managing volunteers, blogs, media, and basic analytics.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, EJS templates
- **Backend**: Node.js, Express, REST-style routes
- **Database**: MySQL (or MariaDB)
- **Auth**: JWT-based admin authentication with role-based access (SUPER_ADMIN, EDITOR, MODERATOR)

## Features

- **Public Website**
  - Home with hero banner, mission/vision, impact counters (live stats), latest activities, testimonials, and news ticker
  - About Us with history timeline, leadership, org structure, core values, annual reports, and partners
  - Activities & Programs covering all major initiatives
  - Media & Publications (blogs/news via API, gallery, videos, publications, archives)
  - Get Involved with volunteer registration form (saved to DB), volunteer opportunities, donate section, membership/chapter guidelines, corporate partnerships
  - Contact & Locations with contact form UI, national office details, state branches, and embedded Google Map

- **Admin Panel**
  - Login with username/password (bcrypt-hashed), JWT cookie, role-based access
  - Dashboard with key stats (volunteers, blogs) and recent items
  - Volunteer management: list/search/filter, pagination, detail view, delete
  - Blog management: create/edit/delete posts with featured image upload, category, rich text editor, publish/draft status
  - Media library: upload images/videos/docs, list, filter, delete
  - Email system: send email campaigns to volunteers (optionally filtered by state) via SMTP
  - Basic analytics: page view counter and volunteer registration counter via `stats_counters`
  - User management (SUPER_ADMIN): list admins and change roles

## Quick Start (60 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Create .env from example
copy .env.example .env
# Edit .env and set: DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET

# 3. Set up database (schema already imported if DB exists)
node scripts/import_schema.js  # or import db/schema.sql manually

# 4. Create demo admin user
npm run seed-admin -- --username=superadmin --email=admin@example.com --password=Admin123

# 5. Start the server
npm start

# ✓ Open http://localhost:3000/ (public) or http://localhost:3000/admin/login (admin)
```

## Getting Started

### 1. Clone & Install

```bash
cd C:\Users\aarya
git clone <this-repo> charity-website   # or create folder manually
cd charity-website
npm install
```

### 2. Database Setup (MySQL)

1. Create a MySQL database user and database, or use your existing credentials.
2. Import the schema:

```bash
mysql -u YOUR_DB_USER -p < db/schema.sql
```

This creates:

- `admins` (admin users with roles)
- `volunteers` (public volunteer registrations)
- `blogs` (blog/news posts)
- `media` (uploaded files)
- `stats_counters` (for impact counters & analytics)

> Note: The schema includes a seeded `superadmin` user with a placeholder password hash. Use the helper script to create or replace an admin securely.

To create a demo admin user run:

```bash
# interactive: prompts read from env or CLI args
npm run seed-admin -- --username=superadmin --email=admin@example.com --password=admin123
```

This will create a `superadmin` user (or report if it already exists). You can also set `ADMIN_USER`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in your `.env` and run `npm run seed-admin`.

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Key settings:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` – MySQL connection
- `SESSION_SECRET`, `JWT_SECRET` – long random strings
- `SMTP_*` – SMTP settings for emails (volunteer confirmation + admin campaigns)
- `BASE_URL` – usually `http://localhost:3000` in dev

### 4. Run the App

```bash
npm start
# or, with nodemon if installed globally:
npm run dev
```

Visit:

- Public site: `http://localhost:3000/`
- Admin login: `http://localhost:3000/admin/login`

### Demo Admin Credentials

After updating the seeded admin as described above:

- **Username**: `superadmin`
- **Password**: (whatever you used when generating the bcrypt hash, e.g. `admin123`)

### RESTful Endpoints (Public)

- `POST /api/volunteers` – Create volunteer (body: name, email, phone, address, state, city, skills, availability)
- `GET /api/blogs` – List published blogs (`?page=&limit=&category=&search=`)
- `GET /api/blogs/:id` – Blog detail (only PUBLISHED)
- `GET /api/stats` – Impact counters (volunteers_registered, projects_completed, lives_impacted, page_views_total)

### Admin Panel Overview

- `/admin/login` – Login form with bcrypt-hashed password authentication
- `/admin/dashboard` – Overview with volunteer/blog stats and recent items
- `/admin/volunteers` – List/search/filter volunteers by state/city, view details, **export to CSV**
- `/admin/blogs` – List posts, create/edit/delete with featured image upload and TinyMCE rich text editor
- `/admin/media` – Media library for uploading and managing images, videos, PDFs (multi-file upload)
- `/admin/emails` – Send email campaigns to volunteers (optionally filtered by state) via SMTP
- `/admin/users` – Manage admin users and roles (SUPER_ADMIN only)

### Public Website Pages

- `/` – Home page with hero banner, mission/vision, impact counters (live), testimonials, news ticker
- `/about` – History timeline, core values, leadership, organizational structure
- `/activities` – All 8 major program areas (Education, Healthcare, Rural Dev, etc.)
- `/media` – Blog/news showcase, photo/video galleries, publications & press archives
- `/get-involved` – Volunteer registration form (saves to DB + sends confirmation email), donation info
- `/contact` – Contact form, national office details, state branches directory, embedded Google Map

### File Uploads

- Uploaded files are stored under `uploads/` and served via `/uploads/...`.
- Supported types:
  - Images: JPG, PNG, GIF
  - Documents: PDF
  - Videos and others are stored and listed but you can add extra validation in `routes/admin.js`.

### Security Notes

- Uses `helmet` for basic security headers.
- JWT tokens are stored in HttpOnly cookies.
- SQL queries use parameter binding to avoid injection.
- Validation can be extended in models/routes to enforce stricter input checks.
- For production, ensure you:
  - Enable HTTPS (SSL) at the reverse proxy or hosting level.
  - Set `NODE_ENV=production`.
  - Configure a robust SMTP provider (e.g. SendGrid) and verify sender domains.

### SEO & Performance

- Semantic HTML structure and meta description in the public layout.
- Static assets served from `/static` with a simple custom stylesheet.
- For advanced SEO, you can add:
  - Sitemap generation
  - Open Graph / Twitter cards
  - Structured data (JSON-LD)

## Next Steps / Customization

- Connect real media files and PDFs under `public/` or via the media library.
- Integrate an actual payment gateway on the Donate button.
- Replace placeholder images and text with organizational content.
- Extend analytics (e.g. more `stats_counters` for programs, events, chapters).

