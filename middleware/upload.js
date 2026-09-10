const multer = require('multer');
const path = require('path');

// Use memoryStorage so the file buffer can be streamed directly to Cloudinary
// without leaving orphaned temporary files on the server's disk.
const storage = multer.memoryStorage();

const allowedTypes = /jpeg|jpg|png|webp|gif|mp4|mov|webm|pdf/;

function fileFilter(req, file, cb) {
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Unsupported file type. Supported types: jpeg, jpg, png, webp, gif, mp4, mov, webm, pdf'));
}

const maxSizeMb = parseInt(process.env.MAX_UPLOAD_MB || '15', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = upload;
