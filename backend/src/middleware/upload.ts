import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'application/pdf': '.pdf',
};

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.pdf'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    let ext = path.extname(file.originalname).toLowerCase();
    
    // Fallback to extension inferred from mimetype if original name lacks extension (e.g. camera blob)
    if (!ext || ext === '') {
      ext = MIME_EXTENSION_MAP[file.mimetype] || '.jpg';
    }

    cb(null, `bill-${timestamp}-${randomSuffix}${ext}`);
  },
});

export const uploadBillImage = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
    const hasAllowedMime = !!MIME_EXTENSION_MAP[file.mimetype];

    // Accept if valid extension OR valid image/pdf mimetype
    if (hasAllowedExt || hasAllowedMime) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  },
});
