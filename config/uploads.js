const fs = require('fs');
const path = require('path');

const uploadsDir = process.env.UPLOADS_DIR || (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads'));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (process.env.VERCEL) {
  console.warn('[uploads] Vercel detected: /tmp/uploads is ephemeral. Uploaded media may disappear between invocations. For production, use persistent storage.');
}

module.exports = {
  uploadsDir,
  uploadsUrl: '/uploads',
};
