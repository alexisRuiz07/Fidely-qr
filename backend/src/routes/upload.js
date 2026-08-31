import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'logos';

// Subida multipart en memoria (máx. 5MB, solo imágenes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new ApiError(400, 'El archivo debe ser una imagen', 'NOT_IMAGE'));
  },
});

router.use(requireAuth, requireAdmin);

// Asegura que el bucket exista en Supabase Storage
async function ensureBucket() {
  const { data: list, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  const exists = list.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
  }
}

// POST /api/upload/logo   (multipart: field "file")
// Sube el logo del negocio y devuelve su URL pública.
router.post(
  '/logo',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, 'No se recibió ningún archivo', 'NO_FILE');

    await ensureBucket();

    const ext = req.file.mimetype.split('/')[1] || 'png';
    const filePath = `${req.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (upErr) throw upErr;

    const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    res.status(201).json({ url: pubData.publicUrl });
  })
);

export default router;
