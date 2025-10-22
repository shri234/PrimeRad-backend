const express = require("express");
const router = express.Router();
const { uploadTwoImages } = require("../config/uploadImage");
const authMiddleware = require("../middlewares/authMiddleware");
const sessionAccessMiddleware = require("../middlewares/sessionAccessMiddleware");

const {
  createSession,
  getSessions,
  updateSession,
  getCompletedSessionsByUsers,
  deleteSession,
  getWatchedSessions,
  trackSessionView,
  getTopWatchedSessions,
  getTopRatedCases,
  getTopRatedLectures,
  getRecentItems,
  updateSessionFaculties,
  getUpcomingLivePrograms,
  getSessionsByDifficulty,
  generateAIComparison,
} = require("../controllers/session.controller");

const optionalAuth = (req, res, next) => {
  const token = req.cookies?.jwt || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    User.findById(decoded._id)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch (err) {
    req.user = null;
    next();
  }
};

// Admin/Faculty only routes (require auth)
router.post("/create", authMiddleware, uploadTwoImages, createSession);
router.put("/update", authMiddleware, uploadTwoImages, updateSession);
router.put(
  "/updateFaculties/:sessionId/:sessionType",
  authMiddleware,
  updateSessionFaculties
);
router.delete("/delete", authMiddleware, deleteSession);

router.get("/get", optionalAuth, sessionAccessMiddleware, getSessions);
router.get(
  "/getSessionByDifficulty",
  optionalAuth,
  sessionAccessMiddleware,
  getSessionsByDifficulty
);
router.get(
  "/getRecentItems",
  optionalAuth,
  sessionAccessMiddleware,
  getRecentItems
);
router.get(
  "/getTopRatedLectures",
  optionalAuth,
  sessionAccessMiddleware,
  getTopRatedLectures
);
router.get(
  "/getTopRatedCases",
  optionalAuth,
  sessionAccessMiddleware,
  getTopRatedCases
);
router.get(
  "/getTopWatchedSessions",
  optionalAuth,
  sessionAccessMiddleware,
  getTopWatchedSessions
);
router.get(
  "/getUpcomingLivePrograms",
  optionalAuth,
  sessionAccessMiddleware,
  getUpcomingLivePrograms
);

router.post("/track", authMiddleware, trackSessionView);
router.get("/getWatchedSessions", authMiddleware, getWatchedSessions);
router.get(
  "/getCompletedSessions",
  authMiddleware,
  getCompletedSessionsByUsers
);

router.post("/compare-observations", authMiddleware, generateAIComparison);

module.exports = router;
