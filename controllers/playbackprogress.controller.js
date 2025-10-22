const {
  PlaybackProgress,
  validatePlaybackProgress,
} = require("../models/playbackprogress.model");
const DicomCases = require("../models/dicomcase.model"); // Need to import these to populate
const RecordedLectures = require("../models/recordedlecture.model"); // Need to import these to populate

async function savePlaybackProgress(req, res) {
  const { userId, sessionId, currentTime, sessionModelType } = req.body;

  // Validate incoming data
  const { error } = validatePlaybackProgress(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Validation error", details: error.details });
  }

  try {
    // Check if the session exists in either DicomCases or RecordedLectures
    let sessionExists = false;
    if (sessionModelType === "DicomCase") {
      sessionExists = await DicomCases.findById(sessionId);
    } else if (sessionModelType === "RecordedLecture") {
      sessionExists = await RecordedLectures.findById(sessionId);
    }

    if (!sessionExists) {
      return res.status(404).json({ message: "Session not found." });
    }

    // Find and update, or create if not found
    const progress = await PlaybackProgress.findOneAndUpdate(
      { userId, sessionId, sessionModelType }, // Query by all three to be specific
      { currentTime, lastWatchedAt: new Date() }, // Update currentTime and lastWatchedAt
      { upsert: true, new: true, setDefaultsOnInsert: true } // upsert: create if not found; new: return updated doc
    );

    res.status(200).json({
      message: "Playback progress saved successfully",
      data: progress,
    });
  } catch (err) {
    console.error("Error saving playback progress:", err);
    // Handle unique constraint error if it occurs before Mongoose catches it
    if (err.code === 11000) {
      // MongoDB duplicate key error code
      return res.status(409).json({
        message:
          "Duplicate entry for user and session. This should not happen with findOneAndUpdate upsert, but catching just in case.",
      });
    }
    res.status(500).json({
      message: "Failed to save playback progress",
      error: err.message,
    });
  }
}

async function getSinglePlaybackProgress(req, res) {
  const { userId, sessionId } = req.params; // Get from URL params

  try {
    const progress = await PlaybackProgress.findOne({ userId, sessionId });

    if (progress) {
      res.status(200).json({
        currentTime: progress.currentTime,
        lastWatchedAt: progress.lastWatchedAt,
      });
    } else {
      res.status(200).json({
        currentTime: 0,
        message: "No progress found for this session and user.",
      }); // Indicate no progress
    }
  } catch (err) {
    console.error("Error fetching single playback progress:", err);
    res.status(500).json({
      message: "Failed to fetch playback progress",
      error: err.message,
    });
  }
}

async function getAllUserPlaybackProgress(req, res) {
  const { userId } = req.params;

  try {
    const progressRecords = await PlaybackProgress.find({ userId }).sort({
      lastWatchedAt: -1,
    });

    const populatedProgress = await Promise.all(
      progressRecords.map(async (record) => {
        let sessionDetails = null;
        if (record.sessionModelType === "DicomCase") {
          sessionDetails = await DicomCases.findById(record.sessionId);
        } else if (record.sessionModelType === "RecordedLecture") {
          sessionDetails = await RecordedLectures.findById(record.sessionId);
        }

        if (sessionDetails) {
          // Determine duration based on session type
          let durationValue = ""; // Default empty string

          if (record.sessionModelType === "RecordedLecture") {
            durationValue = sessionDetails.sessionDuration || "";
          }

          return {
            id: sessionDetails._id,
            type: sessionDetails.title,
            contentType:
              record.sessionModelType === "DicomCase" ? "Case" : "Lecture",
            level: sessionDetails.difficulty || "Beginner",
            status: sessionDetails.isFree ? "Free" : "Locked",
            thumbnail: sessionDetails.imageUrl_1920x1080
              ? `/uploads/${
                  sessionDetails.imageUrl_1920x1080.split("/uploads/")[1]
                }`
              : sessionDetails.imageUrl
              ? `/uploads/${sessionDetails.imageUrl.split("/uploads/")[1]}`
              : "/default-thumbnail.jpg",
            duration: durationValue, // Use the determined duration value
            category:
              sessionDetails.moduleName || sessionDetails.subCategoryId || "",
            currentTime: record.currentTime,
            lastWatchedAt: record.lastWatchedAt,
            vimeoVideoId: sessionDetails.vimeoVideoId || null,
            description:
              sessionDetails.description || "No description available.",
            faculty: sessionDetails.faculty || "Unknown Faculty",
            module: sessionDetails.moduleName || "General",
            submodule: sessionDetails.subCategoryId || "General",
            startDate: sessionDetails.startDate,
          };
        }
        return null;
      })
    );

    const filteredPopulatedProgress = populatedProgress.filter(Boolean);

    res.status(200).json({
      message: "User playback progress fetched successfully",
      data: filteredPopulatedProgress,
    });
  } catch (err) {
    console.error("Error fetching all user playback progress:", err);
    res.status(500).json({
      message: "Failed to fetch user playback progress",
      error: err.message,
    });
  }
}

module.exports = {
  savePlaybackProgress,
  getSinglePlaybackProgress,
  getAllUserPlaybackProgress,
};
