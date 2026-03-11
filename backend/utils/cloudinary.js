const { v2: cloudinary } = require('cloudinary');
const multerCloudinary = require('multer-storage-cloudinary');
const { getAllowedExtensions } = require('./uploadConfig');

const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedDocumentFormats = getAllowedExtensions('documents');

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'edusync_vault',
    resource_type: 'auto',
    allowed_formats: allowedDocumentFormats,
    use_filename: true,
    unique_filename: true,
    filename_override: String(file.originalname || 'document')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 80),
  }),
});

module.exports = {
  cloudinary,
  storage: documentStorage,
  documentStorage,
};
