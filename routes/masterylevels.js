const express = require("express");
const router = express.Router();

const {
  createMasteryLevels,
  getMasteryLevels,
  //   updateSession,
} = require("../controllers/masterylevels.controller");

router.post("/create", createMasteryLevels);
router.get("/get", getMasteryLevels);

module.exports = router;
