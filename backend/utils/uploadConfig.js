const multer = require("multer");

const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;

const FILE_UPLOAD_RULES = {
  documents: {
    fieldName: "document_file",
    maxFileSize: MAX_UPLOAD_FILE_SIZE,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "image/png",
      "image/jpeg",
      "image/webp",
    ],
    allowedExtensions: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "png", "jpg", "jpeg", "webp"],
    errorMessage:
      "Unsupported file type. Upload a PDF, Office document, text file, CSV, or image.",
  },
  modules: {
    fieldName: "file",
    maxFileSize: MAX_UPLOAD_FILE_SIZE,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    allowedExtensions: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "png", "jpg", "jpeg", "webp"],
    errorMessage:
      "Unsupported file type. Upload a PDF, Office document, text file, CSV, or image.",
  },
};

function getAllowedMimeTypes(category) {
  return [...(FILE_UPLOAD_RULES[category]?.allowedMimeTypes || [])];
}

function getAllowedExtensions(category) {
  return [...(FILE_UPLOAD_RULES[category]?.allowedExtensions || [])];
}

function createFileFilter(category) {
  const rule = FILE_UPLOAD_RULES[category];

  if (!rule) {
    throw new Error(`Unknown upload category: ${category}`);
  }

  const allowedMimeTypes = new Set(rule.allowedMimeTypes);

  return (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error(rule.errorMessage));
    }

    return cb(null, true);
  };
}

function createMemoryUpload(category) {
  const rule = FILE_UPLOAD_RULES[category];

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: rule.maxFileSize,
    },
    fileFilter: createFileFilter(category),
  });
}

module.exports = {
  MAX_UPLOAD_FILE_SIZE,
  FILE_UPLOAD_RULES,
  getAllowedMimeTypes,
  getAllowedExtensions,
  createFileFilter,
  createMemoryUpload,
};
