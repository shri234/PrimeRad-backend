const express = require("express");
const router = express.Router();
const { upload } = require("../config/uploadImage");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createPathologies,
  getPathologies,
  getPathologyImages,
  getPathologiesByModule,
  //   updatePathologies,
} = require("../controllers/pathology.controller");

router.post(
  "/create",
  // authMiddleware,
  upload.single("image"),
  createPathologies
);
router.get(
  "/get",
  // authMiddleware,
  getPathologies
);
router.get("/getImage", getPathologyImages);
router.get("/getByModule", getPathologiesByModule);

module.exports = router;
