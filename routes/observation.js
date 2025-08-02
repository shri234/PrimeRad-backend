const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
// const upload = require("../config/uploadImage");

const {
  createObservations,
  getObservations,
  submitAnswers,
  getScoreForAllResources,
  //   updateSession,
} = require("../controllers/observations.controller");

router.post("/create", createObservations);
router.post("/submitAnswers", authMiddleware, submitAnswers);
router.get("/get", getObservations);
router.get("/getAllScores", getScoreForAllResources);

module.exports = router;
