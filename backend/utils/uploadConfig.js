const path = require('path');
const multer = require('multer');

const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 150;

const FILE_UPLOAD_RULES = {
  documents: {
    fieldName: 'document_file',
    maxFileSize: MAX_UPLOAD_FILE_SIZE,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/webp',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'webp'],
    errorMessage: 'Unsupported file type. Upload a PDF, Office document, text file, CSV, or image.',
  },
  modules: {
    fieldName: 'file',
    maxFileSize: MAX_UPLOAD_FILE_SIZE,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    allowedExtensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'png', 'jpg', 'jpeg', 'webp'],
    errorMessage: 'Unsupported file type. Upload a PDF, Office document, text file, CSV, or image.',
  },
};

function getAllowedMimeTypes(category) {
  return [...(FILE_UPLOAD_RULES[category]?.allowedMimeTypes || [])];
}

function getAllowedExtensions(category) {
  return [...(FILE_UPLOAD_RULES[category]?.allowedExtensions || [])];
}

function getFileExtension(filename = '') {
  return path.extname(filename).replace('.', '').trim().toLowerCase();
}

function isSafeOriginalName(filename = '') {
  return (
    typeof filename === 'string' &&
    filename.trim().length > 0 &&
    filename.length <= MAX_FILENAME_LENGTH &&
    !filename.includes('..')
  );
}

function createFileFilter(category) {
  const rule = FILE_UPLOAD_RULES[category];

  if (!rule) {
    throw new Error(`Unknown upload category: ${category}`);
  }

  const allowedMimeTypes = new Set(rule.allowedMimeTypes);
  const allowedExtensions = new Set(rule.allowedExtensions);

  return (req, file, cb) => {
    const extension = getFileExtension(file.originalname || '');

    if (!isSafeOriginalName(file.originalname || '')) {
      return cb(new Error('Invalid file name. Please rename the file and try again.'));
    }

    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error(rule.errorMessage));
    }

    return cb(null, true);
  };
}

function matchesMagicBytes(file) {
  if (!file?.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    return true;
  }

  const extension = getFileExtension(file.originalname || '');
  const hex = file.buffer.subarray(0, 16).toString('hex').toLowerCase();
  const ascii = file.buffer.subarray(0, 8).toString('utf8');

  if (['txt', 'csv'].includes(extension)) {
    return true;
  }
  if (extension === 'pdf') {
    return ascii.startsWith('%PDF-');
  }
  if (['jpg', 'jpeg'].includes(extension)) {
    return hex.startsWith('ffd8ff');
  }
  if (extension === 'png') {
    return hex.startsWith('89504e470d0a1a0a');
  }
  if (extension === 'webp') {
    return file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' && file.buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (['doc', 'xls', 'ppt'].includes(extension)) {
    return hex.startsWith('d0cf11e0a1b11ae1');
  }
  if (['docx', 'xlsx', 'pptx'].includes(extension)) {
    return hex.startsWith('504b0304') || hex.startsWith('504b0506') || hex.startsWith('504b0708');
  }

  return true;
}

function validateUploadedFile(category) {
  const rule = FILE_UPLOAD_RULES[category];

  if (!rule) {
    throw new Error(`Unknown upload category: ${category}`);
  }

  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    const extension = getFileExtension(req.file.originalname || '');
    const allowedExtensions = new Set(rule.allowedExtensions);

    if (!allowedExtensions.has(extension)) {
      return next(new Error(rule.errorMessage));
    }

    if (!matchesMagicBytes(req.file)) {
      return next(new Error('The uploaded file content does not match its extension.'));
    }

    return next();
  };
}

function createMemoryUpload(category) {
  const rule = FILE_UPLOAD_RULES[category];

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: rule.maxFileSize,
      files: 1,
      fieldNameSize: 100,
      fieldSize: 2 * 1024 * 1024,
    },
    fileFilter: createFileFilter(category),
  });
}

module.exports = {
  MAX_UPLOAD_FILE_SIZE,
  MAX_FILENAME_LENGTH,
  FILE_UPLOAD_RULES,
  getAllowedMimeTypes,
  getAllowedExtensions,
  getFileExtension,
  createFileFilter,
  createMemoryUpload,
  validateUploadedFile,
};
