import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ── multer storage ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext   = path.extname(file.originalname).toLowerCase();
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `product-${stamp}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

/* ── POST /api/upload/image ── */
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  // return the public URL path — served statically as /uploads/<filename>
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    imageUrl,
    filename: req.file.filename,
    size:     req.file.size,
  });
});

/* ── DELETE /api/upload/image/:filename ── */
router.delete('/image/:filename', authMiddleware, (req, res) => {
  const { filename } = req.params;

  // basic guard — no path traversal
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  fs.unlinkSync(filePath);
  res.json({ message: 'Image deleted' });
});

/* ── multer error handler ── */
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image is too large. Max size is 5 MB.' });
  }
  res.status(400).json({ message: err.message || 'Upload error' });
});

export default router;
