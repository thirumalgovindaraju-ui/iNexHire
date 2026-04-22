// src/routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { uploadAudio } from '../services/storage.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'video/webm'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `File type ${file.mimetype} not allowed`) as any);
    }
  },
});

// POST /api/upload/audio
router.post('/audio', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'No file uploaded');

    const { interviewId, questionId } = req.body;
    if (!interviewId || !questionId) throw new AppError(400, 'interviewId and questionId required');

    const ext = req.file.mimetype.split('/')[1];
    const filename = `interviews/${interviewId}/${questionId}.${ext}`;

    const url = await uploadAudio(req.file.buffer, filename, req.file.mimetype);

    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
});

export default router;
