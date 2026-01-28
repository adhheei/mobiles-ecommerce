// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/misc';
    if (req.originalUrl.includes('/categories')) {
      uploadPath = 'public/uploads/categories';
    } else if (req.originalUrl.includes('/products')) {
      uploadPath = 'public/uploads/products';
    } else if (req.originalUrl.includes('/user') || req.originalUrl.includes('/avatar')) {
      uploadPath = 'public/uploads/profiles';
    }
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let prefix = 'file-';
    if (file.fieldname === 'image') prefix = 'cat-';
    if (file.fieldname === 'mainImage') prefix = 'prod-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  single: upload.single('image'),
  product: upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ])
};