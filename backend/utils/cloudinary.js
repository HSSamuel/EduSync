const cloudinary = require("cloudinary").v2;
const multerCloudinary = require("multer-storage-cloudinary");
require("dotenv").config();
const { getAllowedExtensions } = require("./uploadConfig");

const CloudinaryStorage = multerCloudinary.CloudinaryStorage || multerCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edusync_vault",
    resource_type: "auto",
    allowed_formats: getAllowedExtensions("documents"),
  },
});

module.exports = { cloudinary, storage };
