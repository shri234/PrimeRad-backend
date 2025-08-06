const express = require("express");
const router = express.Router();
const { uploadTwoImages } = require("../config/uploadImage");
const authMiddleware = require("../middlewares/authMiddleware"); // Assuming you'll re-enable this later

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
  // Import the new method
} = require("../controllers/session.controller");

// --- CREATE SESSION ---
// Handles creation of DicomCases, RecordedLectures, and LivePrograms based on sessionType in body
router.post(
  "/create",
  // authMiddleware, // Uncomment when authentication is ready
  uploadTwoImages, // Middleware to handle image uploads for sessions
  createSession
);

// --- TRACK SESSION VIEW ---
// Tracks views for any session type
router.post(
  "/track",
  // authMiddleware, // Uncomment when authentication is ready
  trackSessionView
);

router.get(
  "/get",
  // authMiddleware,
  getSessions
);

router.get(
  "/getSessionByDifficulty",
  // authMiddleware,
  getSessionsByDifficulty
);

router.get(
  "/getRecentItems",
  // authMiddleware,
  getRecentItems
);

// --- GET TOP RATED LECTURES ---
router.get(
  "/getTopRatedLectures",
  // authMiddleware, // Uncomment when authentication is ready
  getTopRatedLectures
);

// --- GET TOP RATED CASES ---
router.get(
  "/getTopRatedCases",
  // authMiddleware, // Uncomment when authentication is ready
  getTopRatedCases
);

// --- GET WATCHED SESSIONS ---
// Retrieves sessions watched by a specific user, combines all types
router.get(
  "/getWatchedSessions",
  // authMiddleware, // Uncomment when authentication is ready
  getWatchedSessions
);

router.get(
  "/getCompletedSessions",
  // authMiddleware, // Uncomment when authentication is ready
  getCompletedSessionsByUsers
);

// --- GET TOP WATCHED SESSIONS ---
// Retrieves sessions with the highest view counts, combines all types
router.get(
  "/getTopWatchedSessions",
  // authMiddleware, // Uncomment when authentication is ready
  getTopWatchedSessions
);

router.get(
  "/getUpcomingLivePrograms",
  // authMiddleware, // Uncomment when authentication is ready
  getUpcomingLivePrograms
);

// --- UPDATE SESSION ---
// Handles updates for DicomCases, RecordedLectures, and LivePrograms based on sessionType in query
router.put(
  "/update",
  // authMiddleware, // Uncomment when authentication is ready
  uploadTwoImages, // Middleware to handle image uploads for updates
  updateSession
);

// --- UPDATE SESSION FACULTIES (NEW ROUTE) ---
// Updates the faculty array for a specific session (Dicom, Vimeo, or Live)
// Uses URL parameters for sessionId and sessionType
router.put(
  "/updateFaculties/:sessionId/:sessionType", // Example: /updateFaculties/65c8a4c1b2e3f4a5d6c7b8e9/dicom
  // authMiddleware, // Uncomment when authentication is ready
  updateSessionFaculties
);

// --- DELETE SESSION ---
// Handles deletion of DicomCases, RecordedLectures, and LivePrograms based on sessionType in query
router.delete(
  "/delete",
  // authMiddleware, // Uncomment when authentication is ready
  deleteSession
);

module.exports = router;
