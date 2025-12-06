const multer = require('multer');
const path = require('path');

// Configuration pour l'upload en mémoire
const storage = multer.memoryStorage();

// Filter pour les images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configuration pour images de produits (multiple)
const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 images par produit
  },
  fileFilter: imageFilter
}).array('images', 5);

// Configuration pour avatar utilisateur (single)
const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: imageFilter
}).single('avatar');

// Filter pour les vidéos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|webm|ogg|avi|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /video\//.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// Configuration pour vidéo de produit (single)
const uploadProductVideo = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: videoFilter
}).single('video');

// Configuration pour upload mixte (images + vidéo)
const uploadProductMedia = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les vidéos
    files: 6 // Maximum 5 images + 1 vidéo
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'images') {
      return imageFilter(req, file, cb);
    } else if (file.fieldname === 'video') {
      return videoFilter(req, file, cb);
    } else {
      cb(new Error('Unexpected field'), false);
    }
  }
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]);

module.exports = {
  uploadProductImages,
  uploadAvatar,
  uploadProductVideo,
  uploadProductMedia
};