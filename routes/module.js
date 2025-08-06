const express = require("express");
const router = express.Router();
const { upload } = require("../config/uploadImage");

const {
  createModules,
  getModules,
  getModulesWithPathologyCount,
  getModulesWithSessionCount,
  //   updateModules,
} = require("../controllers/module.controller");

router.post("/create", upload.single("image"), createModules);
router.get("/get", getModules);
router.get("/modules-with-pathology-count", getModulesWithPathologyCount);
router.get("/getModulesSessionCount", getModulesWithSessionCount);

module.exports = router;
