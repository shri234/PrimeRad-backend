const multer = require("multer");
const path = require("path");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Set uploads folder as destination
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Create unique filenames
  },
});

// Initialize Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Set file size limit (e.g., 2MB)
  },
});

// Accept two images with specific field names
const uploadTwoImages = upload.fields([
  { name: "image1920x1080", maxCount: 1 },
  { name: "image522x760", maxCount: 1 },
]);

module.exports = {
  upload,
  uploadTwoImages,
};
