# Project Structure & Database

## File Organization

```
charity-website/
├── config/
│   └── db.js                 # MySQL connection pool
├── models/
│   ├── adminModel.js         # Admin CRUD operations
│   ├── blogModel.js          # Blog CRUD operations
│   ├── mediaModel.js         # Media file operations
│   ├── statsModel.js         # Analytics counters
│   └── volunteerModel.js     # Volunteer CRUD + search
├── middleware/
│   └── auth.js               # JWT auth & role checks
├── routes/
│   ├── api.js                # Public API endpoints
│   └── admin.js              # Admin panel routes
├── views/
│   ├── admin/
│   │   ├── layout.ejs        # Admin master template
│   │   ├── login.ejs         # Admin login form
│   │   ├── dashboard.ejs     # Overview & stats
│   │   ├── blogs/
│   │   │   ├── form.ejs      # Blog editor with TinyMCE
│   │   │   └── index.ejs     # Blog list with filters
│   │   ├── volunteers/
│   │   │   ├── index.ejs     # Volunteer list + CSV export
│   │   │   └── show.ejs      # Volunteer detail view
│   │   ├── media/
│   │   │   └── index.ejs     # Media library upload/view
│   │   ├── emails/
│   │   │   └── index.ejs     # Email campaign form
│   │   └── users/
│   │       └── index.ejs     # Manage admin roles
│   └── public/
│       ├── layout.ejs        # Public master template
│       ├── home.ejs          # Hero + impact counters
│       ├── about.ejs         # History timeline
│       ├── activities.ejs    # Program cards
│       ├── media.ejs         # Galleries & publications
│       ├── get-involved.ejs  # Volunteer form + donate
│       ├── contact.ejs       # Contact form + map
│       ├── 404.ejs           # Not found page
│       └── 500.ejs           # Error page
├── public/
│   ├── css/
│   │   └── style.css         # Custom Bootstrap extensions
│   └── js/
│       └── main.js           # Volunteer form + stats counter
├── uploads/                  # Blog/media uploads (auto-created)
├── scripts/
│   ├── create_admin.js       # Create admin user utility
│   └── import_schema.js      # Database schema import
├── db/
│   └── schema.sql            # Complete DB schema
├── server.js                 # Express app setup
├── package.json              # Dependencies
├── .env                      # Configuration (git-ignored)
├── .env.example              # Example config
├── .gitignore                # Git ignore rules
├── README.md                 # Main documentation
└── DEPLOYMENT.md             # Production guidelines
```

## Database Schema

### admins
Stores admin/editor user accounts with role-based access.

| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED | Primary key |
| username | VARCHAR(50) | Unique, required |
| email | VARCHAR(120) | Unique, required |
| password_hash | VARCHAR(255) | Bcrypt hashed |
| role | ENUM | SUPER_ADMIN, EDITOR, MODERATOR |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-update |

### volunteers
Public volunteer registrations from the "Get Involved" form.

| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED | Primary key |
| name | VARCHAR(120) | Required |
| email | VARCHAR(120) | Required |
| phone | VARCHAR(30) | Required |
| address | VARCHAR(255) | Optional |
| state | VARCHAR(100) | For filters |
| city | VARCHAR(100) | For filters |
| skills | VARCHAR(255) | Comma-separated list |
| availability | VARCHAR(255) | Free text (weekends, etc.) |
| registered_date | DATETIME | Auto-timestamp |

**Indexes**: (state, city), registered_date

### blogs
Blog posts and news articles with publish status control.

| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED | Primary key |
| title | VARCHAR(255) | Required |
| featured_image | VARCHAR(255) | File path to /uploads/ |
| category | VARCHAR(100) | Education, Healthcare, etc. |
| content | LONGTEXT | HTML from TinyMCE |
| author | VARCHAR(120) | Admin username |
| publish_date | DATE | Planned publish date |
| status | ENUM | DRAFT or PUBLISHED |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-update |

**Indexes**: (status, publish_date), category

### media
Uploaded images, videos, and documents for the media library.

| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED | Primary key |
| filename | VARCHAR(255) | Original filename |
| file_path | VARCHAR(255) | /uploads/... path |
| file_type | VARCHAR(50) | MIME type |
| uploaded_by | INT UNSIGNED | Foreign key to admins (nullable) |
| uploaded_at | TIMESTAMP | Auto-set |

**Indexes**: file_type

### stats_counters
Key-value store for impact metrics and analytics.

| Field | Type | Notes |
|-------|------|-------|
| id | INT UNSIGNED | Primary key |
| key_name | VARCHAR(100) | Unique (volunteers_registered, etc.) |
| value | BIGINT | Counter value |
| updated_at | TIMESTAMP | Auto-update |

**Common Keys**:
- `volunteers_registered` – Total volunteer signups
- `projects_completed` – Completed initiatives
- `lives_impacted` – People affected
- `page_views_total` – Website traffic count

## Key Routes Summary

### Public Routes
- `GET /` – Home page
- `GET /about` – About/history
- `GET /activities` – Programs
- `GET /media` – Media/blogs showcase
- `GET /get-involved` – Volunteer registration
- `GET /contact` – Contact page
- `POST /api/volunteers` – Register volunteer
- `GET /api/blogs` – Fetch published blogs
- `GET /api/blogs/:id` – Blog detail
- `GET /api/stats` – Impact counters

### Admin Routes (Protected)
- `GET/POST /admin/login` – Authentication
- `GET /admin/logout` – Clear session
- `GET /admin/dashboard` – Overview
- `GET/POST /admin/volunteers` – List/filter
- `GET /admin/volunteers/:id` – Detail
- `GET /admin/volunteers/export/csv` – CSV download
- `POST /admin/volunteers/:id/delete` – Remove
- `GET/POST /admin/blogs` – List/create
- `GET/POST /admin/blogs/:id` – Edit
- `POST /admin/blogs/:id/delete` – Remove
- `GET/POST /admin/media` – Upload/manage
- `POST /admin/media/:id/delete` – Remove file
- `GET/POST /admin/emails` – Send campaigns
- `GET/POST /admin/users` – Role management

## Technology Highlights

- **Frontend Framework**: Bootstrap 5 (responsive grid/components)
- **Backend Framework**: Express.js (routing, middleware)
- **Database**: MySQL with async/await (mysql2/promise)
- **Authentication**: JWT in HttpOnly cookies + bcrypt password hashing
- **Rich Text Editor**: TinyMCE 6 (blog content)
- **File Uploads**: Multer (images, PDFs, videos)
- **Security**: Helmet (headers), Parameter binding (SQL injection prevention)
- **Email**: Nodemailer (SMTP-based campaigns)
- **Template Engine**: EJS (server-side rendering)

## API Response Format

All public endpoints return JSON:

```json
{
  "success": true/false,
  "data": {},
  "message": "Optional error message",
  "total": 100,
  "page": 1,
  "limit": 10
}
```

## Authentication Flow

1. User submits username/password at `/admin/login`
2. Server verifies bcrypt hash against database
3. JWT token generated with user ID, role, username
4. Token stored in `token` cookie (HttpOnly)
5. Subsequent requests verify token via `authRequired` middleware
6. Role-based routes check `roleRequired(['SUPER_ADMIN', 'EDITOR'])`
7. Logout clears cookie and redirects to login

---

For questions or advanced customization, refer to [Express Docs](https://expressjs.com/) and [MySQL Docs](https://dev.mysql.com/doc/).
