const fs = require('fs');
const path = require('path');

const uploadsDir = process.env.UPLOADS_DIR || (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads'));
const resolvedUploadsDir = path.resolve(uploadsDir);

console.log(`[uploads] uploadsDir resolved to: ${resolvedUploadsDir}`);

if (!fs.existsSync(resolvedUploadsDir)) {
  fs.mkdirSync(resolvedUploadsDir, { recursive: true });
}

const tempTestFile = path.join(resolvedUploadsDir, `.upload-write-test-${Date.now()}.tmp`);
try {
  fs.writeFileSync(tempTestFile, 'ok');
  fs.unlinkSync(tempTestFile);
} catch (err) {
  throw new Error(`[uploads] Cannot write to uploads directory: ${resolvedUploadsDir}. Ensure UPLOADS_DIR exists and is writable. Original error: ${err.message}`);
}

if (process.env.VERCEL) {
  console.warn('[uploads] Vercel detected: /tmp/uploads is ephemeral. Uploaded media may disappear between invocations. For production, use persistent storage.');
}

module.exports = {
  uploadsDir: resolvedUploadsDir,
  uploadsUrl: '/uploads',
};
