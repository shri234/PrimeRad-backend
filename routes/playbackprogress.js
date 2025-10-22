const express = require("express");
const router = express.Router();
const playbackProgressController = require("../controllers/playbackprogress.controller");

router.post("/save", playbackProgressController.savePlaybackProgress);

router.get(
  "/playback-progress/:userId/:sessionId",
  playbackProgressController.getSinglePlaybackProgress
);

router.get(
  "/playback-progress/user/:userId",
  playbackProgressController.getAllUserPlaybackProgress
);

module.exports = router;
