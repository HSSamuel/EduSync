const cloudinary = require("cloudinary").v2;
const multerCloudinary = require("multer-storage-cloudinary");
require("dotenv").config();

// Bulletproof import: Handles both older and newer versions of the package
const CloudinaryStorage =
  multerCloudinary.CloudinaryStorage || multerCloudinary;

// 1. Authenticate with your Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Set up the Multer Storage Engine to pipe files directly to the cloud
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "edusync_vault", // The folder name inside your Cloudinary account
    resource_type: "auto", // "auto" allows PDFs and Docs, not just images
    allowed_formats: ["jpg", "png", "pdf", "doc", "docx"],
  },
});

module.exports = { cloudinary, storage };
