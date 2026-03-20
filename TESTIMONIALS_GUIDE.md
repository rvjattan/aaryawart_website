# Testimonials Management & Updated Site Settings - Implementation Guide

## Overview
This implementation adds a complete testimonials management system and restructures the admin site settings into organized sections for easier management.

## What's New

### 1. **Public Testimonials Section** ✅
- **URL**: `/testimonials`
- **Features**:
  - Users can submit testimonials via a form
  - View all approved testimonials on the website
  - Testimonials show submitter name, message, and submit date
  - Submit alert message confirms testimonial is pending approval

### 2. **Admin Testimonials Management** ✅
- **URL**: `/admin/testimonials`
- **Features**:
  - View all submitted testimonials with status badges
  - Filter by status: All, Pending, Approved
  - **Approve** - Move testimonial to public website
  - **Reject** - Remove approval status (can approve later)
  - **Delete** - Permanently remove testimonial
  - Pagination for easy navigation
  - Accessible to SUPER_ADMIN, EDITOR, and MODERATOR roles

### 3. **Restructured Admin Settings** ✅
- **URL**: `/admin/settings`
- **New Organization**:
  1. **Site Identity** - Name, tagline, logo
  2. **Address** - Organization contact details
  3. **About Us** - Footer about text
  4. **News Ticker** - Latest updates/news
  5. **Links & Social Media** - Quick links and social profiles
- Improved UI with color-coded sections and icons
- Better form organization and placeholders

### 4. **Updated Navigation** ✅
- All public pages now include "Testimonials" link in navigation
- Admin panel includes new "Testimonials" menu item

---

## Database Changes

### New Table: `testimonials`
```sql
CREATE TABLE testimonials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_testimonials_is_approved (is_approved),
  INDEX idx_testimonials_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**To Update Your Database:**
```bash
mysql -u root -p charity_org < db/schema.sql
# Or manually run the testimonials table creation
```

---

## API Endpoints

### Public API

#### Submit a Testimonial
```
POST /api/testimonials
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your organization changed my life..."
}

Response: { "success": true, "data": {...}, "message": "..." }
```

#### Get Approved Testimonials
```
GET /api/testimonials

Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Alice Smith",
      "message": "Amazing volunteer experience...",
      "submitted_at": "2024-03-20T10:30:00.000Z"
    }
  ]
}
```

---

## File Structure Changes

### New Files Created:
- `models/testimonialModel.js` - Database operations for testimonials
- `views/admin/testimonials/index.ejs` - Admin testimonials management UI
- `views/public/testimonials.ejs` - Public testimonials page

### Modified Files:
- `routes/admin.js` - Added testimonials management routes
- `routes/api.js` - Added testimonials API endpoints
- `db/schema.sql` - Added testimonials table
- `server.js` - Added `/testimonials` page route
- `views/admin/layout.ejs` - Added testimonials nav link
- `views/admin/settings.ejs` - Restructured into organized sections
- `views/public/*.ejs` - Updated navigation across all pages

---

## How to Use

### **For Visitors (Public Website)**

1. Go to `/testimonials` page
2. Fill out the testimonial form:
   - Name (required)
   - Email (required)
   - Message (required)
3. Click "Submit Testimonial"
4. Receive confirmation that testimonial is pending approval
5. Once approved by admin, it appears on the website

### **For Admins (Admin Panel)**

#### Managing Site Settings:
1. Go to `/admin/settings`
2. Edit desired sections:
   - **Site Identity**: Change organization name, tagline, logo
   - **Address**: Update contact information
   - **About Us**: Edit footer description
   - **News Ticker**: Update latest news/announcements
   - **Links & Social Media**: Configure quick links and social profiles
3. Click "Save All Settings"

#### Managing Testimonials:
1. Go to `/admin/testimonials`
2. Use status filters:
   - **All** - View all testimonials
   - **Pending** - View unapproved testimonials (yellow badge)
   - **Approved** - View approved testimonials (green badge)
3. For each testimonial:
   - **Approve** (✓) - Make it public
   - **Reject** (✗) - Remove approval (if already approved)
   - **Delete** (🗑️) - Permanently remove
4. Pagination available for large numbers of testimonials

---

## Workflow Example

### Typical Testimonial Flow:

```
User submits testimonial on /testimonials page
           ↓
[Pending] Email auto-sent to admin notification (optional future feature)
           ↓
Admin visits /admin/testimonials?status=pending
           ↓
Admin clicks ✓ (Approve button)
           ↓
[Approved] Testimonial now shows on public /testimonials page
           ↓
Visitors see the testimonial when loading /testimonials or viewing /api/testimonials
```

---

## Features & Security

### Input Validation:
- ✅ Name validation (required, text)
- ✅ Email validation (required, email format)
- ✅ Message validation (required, text)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection through EJS escaping

### Access Control:
- **Public**: Anyone can submit testimonials
- **Admin**: Only SUPER_ADMIN, EDITOR, MODERATOR can approve/reject
- **Moderator Role**: Can view and manage testimonials (no other admin rights)

### Approval Workflow:
- All new testimonials require approval before display
- Only "is_approved = true" testimonials appear on public site
- Admins can toggle approval status or delete at any time

---

## Customization Guide

### To Change Testimonials Per Page:
Edit `/routes/admin.js` (line ~460):
```js
const result = await testimonialModel.getTestimonials({ 
  page, 
  limit: 50  // Change from 20 to whatever
});
```

### To Change Testimonial Sort Order:
Edit `/models/testimonialModel.js` in `getApprovedTestimonials()`:
```js
// Change DESC to ASC for oldest first
'SELECT ... ORDER BY submitted_at DESC'
```

### To Add Email Notification on Submission:
Edit `/routes/api.js` in testimonial POST handler and add nodemailer code.

### To Require Email Verification:
Add an `email_verified` column to testimonials table and create verification flow.

---

## Testing Checklist

- [ ] Run database migration to create testimonials table
- [ ] Test submitting testimonial on `/testimonials` page
- [ ] Verify admin sees pending testimonial at `/admin/testimonials`
- [ ] Test approve/reject functionality
- [ ] Verify approved testimonials appear on public site
- [ ] Test API endpoints: `GET /api/testimonials`, `POST /api/testimonials`
- [ ] Verify pagination works
- [ ] Test delete functionality
- [ ] Verify navigation links work on all pages
- [ ] Test admin settings updates

---

## Troubleshooting

### Testimonials table not found error:
```bash
# Run the schema migration
mysql -u root -p charity_org < db/schema.sql
```

### Testimonials not showing after approval:
1. Check admin that `is_approved = true` in database
2. Verify API endpoint returns approved testimonials
3. Check browser console for JavaScript errors

### Settings not saving:
1. Verify user has SUPER_ADMIN role
2. Check MySQL connection and permissions
3. Review server logs for errors

---

## Future Enhancements

Ideas for expanding the testimonials system:
- [ ] Email notifications to admin on new submissions
- [ ] Spam detection/filtering
- [ ] Photo upload support for testimonials
- [ ] Rating system (1-5 stars)
- [ ] Testimonials carousel on homepage
- [ ] Email verification before approval
- [ ] Scheduled/scheduled removal of testimonials
- [ ] Testimonial categories
- [ ] Similar testimonial highlighting

---

## Questions or Issues?

For any questions about this implementation, refer to:
- `models/testimonialModel.js` - Data layer logic
- `routes/admin.js` - Admin routes and permission logic
- `routes/api.js` - Public API endpoint logic
- `views/admin/testimonials/index.ejs` - Admin UI
- `views/public/testimonials.ejs` - Public form and display
