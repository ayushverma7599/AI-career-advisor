const multer = require('multer');
const path = require('path');
const { UPLOAD_LIMITS } = require('../config/constants');

// Memory storage for processing before upload to cloud
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'profile_picture': ['image/jpeg', 'image/png', 'image/gif'],
    'signature_image': ['image/jpeg', 'image/png'],
    'id_proof_image': ['image/jpeg', 'image/png', 'application/pdf'],
    'documents': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'attachments': ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
  };

  // Get allowed types for this field
  const fieldAllowedTypes = allowedTypes[file.fieldname] || [];

  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes.join(', ')}`), false);
  }
};

// Size limits for different file types
const getFileSizeLimit = (fieldname) => {
  switch (fieldname) {
    case 'profile_picture':
    case 'signature_image':
      return UPLOAD_LIMITS.IMAGE_SIZE;
    case 'id_proof_image':
    case 'documents':
      return UPLOAD_LIMITS.DOCUMENT_SIZE;
    case 'attachments':
      return UPLOAD_LIMITS.FILE_SIZE;
    default:
      return UPLOAD_LIMITS.FILE_SIZE;
  }
};

// Custom limits function
const limits = {
  fileSize: (req, file) => getFileSizeLimit(file.fieldname),
  files: 10, // Maximum number of files
  fields: 20, // Maximum number of fields
  fieldNameSize: 100,
  fieldSize: 1000000
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_LIMITS.DOCUMENT_SIZE // Use maximum size, will be checked per field
  }
});

// Custom middleware to check file size per field
const checkFileSizes = (req, res, next) => {
  if (!req.files && !req.file) {
    return next();
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    const maxSize = getFileSizeLimit(file.fieldname);
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} exceeds size limit for ${file.fieldname}. Maximum allowed: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
  }

  next();
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next();
};

// Middleware combinations for different use cases
const uploadMiddleware = {
  single: (fieldname) => [upload.single(fieldname), checkFileSizes, handleUploadError],
  array: (fieldname, maxCount = 5) => [upload.array(fieldname, maxCount), checkFileSizes, handleUploadError],
  fields: (fields) => [upload.fields(fields), checkFileSizes, handleUploadError],
  any: () => [upload.any(), checkFileSizes, handleUploadError]
};

// Validate file upload for specific contexts
const validateProfileUpload = [
  upload.fields([
    { name: 'profile_picture', maxCount: 1 },
    { name: 'signature_image', maxCount: 1 },
    { name: 'id_proof_image', maxCount: 1 }
  ]),
  checkFileSizes,
  handleUploadError
];

const validateDocumentUpload = [
  upload.array('documents', 10),
  checkFileSizes,
  handleUploadError
];

const validateForumAttachment = [
  upload.array('attachments', 5),
  checkFileSizes,
  handleUploadError
];

// File validation utility
const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

module.exports = {
  uploadMiddleware,
  validateProfileUpload,
  validateDocumentUpload,
  validateForumAttachment,
  validateFileType,
  validateFileSize,
  handleUploadError
};
