const DicomCases = require("../models/dicomcase.model");
const RecordedLectures = require("../models/recordedlecture.model");
const Pathology = require("../models/pathology.model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const LivePrograms = require("../models/liveprograms.model");
const fs = require("fs");
const OpenAI = require("openai");
const sharp = require("sharp");
const { PlaybackProgress } = require("../models/playbackprogress.model");
const UserSessionView = require("../models/usersessionview.model");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function validateAspectRatio(imagePath, width, height) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return Math.abs(metadata.width / metadata.height - width / height) < 0.01;
  } catch (err) {
    console.error("Error validating image aspect ratio:", err);
    return false;
  }
}

async function createSession(req, res) {
  try {
    console.log(req.body, "Body");
    let getPathologies = req.body?.pathologyId?.trim()
      ? await Pathology.findById(req.body?.pathologyId?.trim())
      : null;

    let imageUrl_1920x1080 =
      req.files && req.files["image1920x1080"]
        ? `/uploads/${req.files["image1920x1080"][0].filename}`
        : req.body?.imageUrl_1920x1080 || null;
    let imageUrl_522x760 =
      req.files && req.files["image522x760"]
        ? `/uploads/${req.files["image522x760"][0].filename}`
        : req.body?.imageUrl_522x760 || null;

    if (req.files && req.files["image1920x1080"]) {
      const filePath = `uploads/${req.files["image1920x1080"][0].filename}`;
      const isValid = await validateAspectRatio(filePath, 1920, 1080);
      if (!isValid) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: "Image 1920x1080 must have aspect ratio 16:9 (1920x1080)",
        });
      }
    }

    if (req.files && req.files["image522x760"]) {
      const filePath = `uploads/${req.files["image522x760"][0].filename}`;
      const isValid = await validateAspectRatio(filePath, 522, 760);
      if (!isValid) {
        fs.unlinkSync(filePath);
        return res
          .status(400)
          .json({ message: "Image 522x760 must have aspect ratio 522:760" });
      }
    }

    const commonSessionData = {
      title: req.body?.title,
      description: req.body?.description,
      moduleName: req.body?.moduleName,
      moduleId: req.body?.moduleId,
      pathologyName: getPathologies?.pathologyName || req.body?.pathologyName,
      pathologyId: req.body?.subCategoryId,
      difficulty: req.body?.difficulty,
      isFree: req.body?.isFree,
      sponsored: req.body?.sponsored,
      imageUrl_1920x1080,
      imageUrl_522x760,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      startTime: req.body?.startTime,
      endTime: req.body?.endTime,
      createdAt: req.body?.createdAt,
      resourceLinks: req.body?.resourceLinks,
      facultyIds: req.body?.faculty,
    };

    if (req.body.sessionType?.trim() === "Dicom") {
      const dicomData = {
        ...commonSessionData,
        isAssessment: req.body?.isAssessment,
        dicomStudyId: req.body?.dicomStudyId,
        dicomCaseId: req.body?.dicomCaseId,
        dicomCaseVideoUrl: req.body?.dicomCaseVideoUrl,
        caseAccessType: req.body?.caseAccessType,
        sessionType: req.body?.sessionType, // Should be "Dicom"
      };
      // Validate
      const { error, value } = DicomCases.validateUser(dicomData); // Assuming validateUser is appropriate
      if (error) {
        return res.status(400).json({
          message: "Validation error for Dicom Case",
          details: error.details,
        });
      }
      await DicomCases.create(value);
    } else if (req.body.sessionType?.trim() === "Vimeo") {
      // Assuming 'Vimeo' sessionType here refers to RecordedLectures
      const recordedData = {
        ...commonSessionData,
        sessionDuration: req.body?.sessionDuration,
        vimeoVideoId: req.body?.vimeoVideoId,
        videoUrl: req.body?.videoUrl,
        videoType: req.body?.videoType, // e.g., 'Recorded'
        sessionType: req.body?.sessionType, // Should be "Vimeo"
        isAssessment: req.body?.isAssessment, // Recorded lectures can also be assessments
      };
      // Validate
      const { error, value } = RecordedLectures.validateUser(recordedData);
      if (error) {
        return res.status(400).json({
          message: "Validation error for Recorded Lecture",
          details: error.details,
        });
      }
      await RecordedLectures.create(value);
    } else if (req.body.sessionType?.trim() === "Zoom") {
      const liveProgramData = {
        ...commonSessionData,
        sessionType: req?.body.liveProgramType,
        zoomMeetingId: req?.body?.zoomMeetingId,
        zoomPassword: req?.body?.zoomPassword,
        zoomJoinUrl: req?.body?.zoomJoinUrl,
        zoomBackUpLink: req?.body?.zoomBackUpLink,
        vimeoVideoId: req?.body?.vimeoVideoId,
        vimeoLiveUrl: req?.body?.vimeoLiveUrl,
      };

      const { error, value } = LivePrograms.validateProgram(liveProgramData);

      if (error) {
        return res.status(400).json({
          message: "Validation error for Live Program",
          details: error.details,
        });
      }
      await LivePrograms.create(value);
    }
    res.status(200).json({ message: "Created Session Successfully" });
  } catch (err) {
    console.error("Error creating session:", err);
    res
      .status(500)
      .json({ message: "Couldn't create session", error: err.message });
  }
}
async function getCompletedSessionsByUsers(req, res) {
  try {
    const { userId } = req.query;

    const completedSessions = await UserSessionView.find({
      userId,
      isCompleted: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: completedSessions.length,
      sessions: completedSessions,
    });
  } catch (error) {
    console.error("Error fetching completed sessions:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
}

async function getSessionsByDifficulty(req, res) {
  try {
    const { pathologyId, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const populateFacultyQuery = { path: "faculty", select: "name image" };
    const difficultyFilter = {
      pathologyId: pathologyId,
    };

    const [dicomSessions, recordedSessions, liveSessions] = await Promise.all([
      DicomCases.find(difficultyFilter)
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 }),
      RecordedLectures.find(difficultyFilter)
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 }),
      LivePrograms.find(difficultyFilter)
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 }),
    ]);

    let combinedSessions = [
      ...dicomSessions.map((session) => ({
        ...session.toObject(),
        sessionType: "Dicom",
      })),
      ...recordedSessions.map((session) => ({
        ...session.toObject(),
        sessionType: "Vimeo",
      })),
      ...liveSessions.map((session) => ({
        ...session.toObject(),
        sessionType: "Live",
      })),
    ];

    // Sort combined sessions by creation date (most recent first)
    combinedSessions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply pagination to combined results
    const totalCount = combinedSessions.length;
    const paginatedSessions = combinedSessions.slice(skip, skip + limitNum);

    return res.status(200).json({
      message: `Got sessions successfully`,
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      data: paginatedSessions,
      breakdown: {
        dicomCount: dicomSessions.length,
        recordedCount: recordedSessions.length,
        liveCount: liveSessions.length,
      },
    });
  } catch (error) {
    console.error("Error in getSessionsByDifficulty:", error);
    return res.status(500).json({
      message: "Error in getting sessions by difficulty",
      error: error.message,
    });
  }
}

async function getSessions(req, res) {
  try {
    let getSessions = [];
    let totalCount = 0;
    const { sessionType, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const populateFacultyQuery = { path: "faculty", select: "name image" };

    switch (sessionType) {
      case "Dicom":
        getSessions = await DicomCases.find({})
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
        totalCount = await DicomCases.countDocuments({});
        break;

      case "Vimeo":
        getSessions = await RecordedLectures.find({})
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
        totalCount = await RecordedLectures.countDocuments({});
        break;

      case "Live":
        getSessions = await LivePrograms.find({})
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum);
        totalCount = await LivePrograms.countDocuments({});
        break;

      case "All":
      default:
        const [dicomDocs, recordedDocs, liveDocs] = await Promise.all([
          DicomCases.find({}).populate(populateFacultyQuery),
          RecordedLectures.find({}).populate(populateFacultyQuery),
          LivePrograms.find({}).populate(populateFacultyQuery), // Fetch LivePrograms
        ]);

        let combinedSessions = [...dicomDocs, ...recordedDocs, ...liveDocs];
        combinedSessions.sort((a, b) => b.createdAt - a.createdAt); // Sort combined list

        totalCount = combinedSessions.length;
        getSessions = combinedSessions.slice(skip, skip + limitNum);
        break;
    }

    return res.status(200).json({
      message: "Got Sessions",
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      data: getSessions,
    });
  } catch (err) {
    console.error("Error getting sessions:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function getTopRatedCases(req, res) {
  try {
    let { page = 1, limit } = req.query;
    const populateFacultyQuery = { path: "faculty", select: "name image" };

    let getCases;
    if (limit === "All") {
      getCases = await DicomCases.find({})
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 });
    } else {
      const limitNum = parseInt(limit, 10) || 10;
      getCases = await DicomCases.find({})
        .populate(populateFacultyQuery)
        .sort({ createdAt: -1 })
        .limit(limitNum);
    }
    return res.status(200).json({
      message: "Got top Cases successfully",
      data: getCases,
    });
  } catch (error) {
    console.error("Error in getting top cases:", error);
    return res.status(500).json({
      message: "Error in getting top cases",
      response: error.message,
    });
  }
}

async function getTopRatedLectures(req, res) {
  try {
    const populateFacultyQuery = { path: "faculty", select: "name image" };
    const getLectures = await RecordedLectures.find({})
      .populate(populateFacultyQuery)
      .sort({ createdAt: -1 })
      .limit(12);

    return res.status(200).json({
      message: "Got top rated lectures successfully",
      data: getLectures,
    });
  } catch (error) {
    console.error("Error in getting top rated lectures:", error);
    return res.status(500).json({
      message: "Error in getting top rated lectures",
      response: error.message,
    });
  }
}

async function getRecentItems(req, res) {
  try {
    const populateFacultyQuery = { path: "faculty", select: "name image" };

    const [getDicomCases, getRecordedLectures, getLivePrograms] =
      await Promise.all([
        // 4. Include LivePrograms
        DicomCases.find({})
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .limit(8),
        RecordedLectures.find({})
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .limit(7),
        LivePrograms.find({}) // Fetch LivePrograms
          .populate(populateFacultyQuery)
          .sort({ createdAt: -1 })
          .limit(5), // Adjust limit as needed for live programs
      ]);
    const getSessions = [
      ...getDicomCases,
      ...getRecordedLectures,
      ...getLivePrograms,
    ]; // Combine all

    // Sort the combined list by createdAt (most recent first)
    getSessions.sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({
      message: "Got recent sessions successfully",
      data: getSessions,
    });
  } catch (error) {
    console.error("Error in getRecentItems:", error);
    return res.status(500).json({
      message: "Error in getting recent sessions",
      response: error.message,
    });
  }
}

async function getTopWatchedSessions(req, res) {
  try {
    const topSessions = await UserSessionView.aggregate([
      {
        $group: {
          _id: "$sessionId",
          totalViews: { $sum: "$viewCount" },
        },
      },
      { $sort: { totalViews: -1 } },
      { $limit: 15 }, // Get top 15 sessions
    ]);

    const sessionIds = topSessions.map((s) => s._id);
    const populateFacultyQuery = { path: "faculty", select: "name image" };

    const [dicomSessions, recordedSessions, liveSessions] = await Promise.all([
      // 5. Include LivePrograms
      DicomCases.find({ _id: { $in: sessionIds } }).populate(
        populateFacultyQuery
      ),
      RecordedLectures.find({ _id: { $in: sessionIds } }).populate(
        populateFacultyQuery
      ),
      LivePrograms.find({ _id: { $in: sessionIds } }).populate(
        // Fetch LivePrograms
        populateFacultyQuery
      ),
    ]);

    let combinedFetchedSessions = [
      ...dicomSessions,
      ...recordedSessions,
      ...liveSessions,
    ]; // Combine all

    const sessionMap = {};
    combinedFetchedSessions.forEach((session) => {
      sessionMap[session._id.toString()] = session;
    });

    const result = topSessions
      .map((item) => {
        const sessionDoc = sessionMap[item._id.toString()];
        if (!sessionDoc) return null;

        return {
          ...sessionDoc.toObject(),
          totalViews: item.totalViews,
          // Add a generic sessionType for frontend to render correctly
          sessionType:
            sessionDoc.sessionType ||
            (sessionDoc.dicomCaseId ? "Dicom" : "Vimeo"),
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      message: "Got top watched sessions successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in getTopWatchedSessions:", error);
    return res.status(500).json({
      message: "Error in getting top watched sessions",
      response: error.message,
    });
  }
}

async function getWatchedSessions(req, res) {
  try {
    const userId = req?.query?.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required to get watched sessions",
      });
    }

    const sessionTypeFilter = req.query.sessionType; // Filter by sessionType if provided
    const limit = parseInt(req.query.limit) || 50;

    let playbackProgressQuery = { userId: userId };
    if (sessionTypeFilter) {
      // Map frontend sessionType to backend modelType if different
      let modelType;
      if (sessionTypeFilter === "Dicom") modelType = "DicomCase";
      else if (sessionTypeFilter === "Vimeo") modelType = "RecordedLecture";
      else if (sessionTypeFilter === "Live") modelType = "LiveProgram"; // Assuming "LiveProgram" in PlaybackProgress
      if (modelType) playbackProgressQuery.sessionModelType = modelType;
    }

    const playbackProgress = await PlaybackProgress.find(playbackProgressQuery)
      .sort({ lastWatchedAt: -1 }) // Sort by last watched for consistency
      .limit(limit);

    if (playbackProgress.length === 0) {
      return res.status(200).json({
        message: "No watched sessions found",
        data: [],
        totalCount: 0,
      });
    }

    const dicomIds = playbackProgress
      .filter((p) => p.sessionModelType === "DicomCase")
      .map((p) => p.sessionId);

    const lectureIds = playbackProgress
      .filter((p) => p.sessionModelType === "RecordedLecture")
      .map((p) => p.sessionId);

    const liveProgramIds = playbackProgress // 6. Include LivePrograms
      .filter((p) => p.sessionModelType === "LiveProgram") // Assuming "LiveProgram" as enum value
      .map((p) => p.sessionId);

    const populateFacultyQuery = { path: "faculty", select: "name image" };

    const [dicomSessions, lectureSessions, liveSessions] = await Promise.all([
      dicomIds.length > 0
        ? DicomCases.find({ _id: { $in: dicomIds } }).populate(
            populateFacultyQuery
          )
        : [],
      lectureIds.length > 0
        ? RecordedLectures.find({ _id: { $in: lectureIds } }).populate(
            populateFacultyQuery
          )
        : [],
      liveProgramIds.length > 0 // Fetch LivePrograms
        ? LivePrograms.find({ _id: { $in: liveProgramIds } }).populate(
            populateFacultyQuery
          )
        : [],
    ]);

    const allSessions = [...dicomSessions, ...lectureSessions, ...liveSessions]; // Combine all

    const watchedSessions = playbackProgress
      .map((progress) => {
        const session = allSessions.find(
          (s) => s._id.toString() === progress.sessionId.toString()
        );

        if (!session) return null;

        let sessionTypeName;
        if (progress.sessionModelType === "DicomCase") {
          sessionTypeName = "Dicom";
        } else if (progress.sessionModelType === "RecordedLecture") {
          sessionTypeName = "Vimeo"; // or "Recorded" depending on your frontend naming
        } else if (progress.sessionModelType === "LiveProgram") {
          sessionTypeName = "Live"; // or "Zoom" / "Vimeo Live"
        }

        return {
          ...session.toObject(),
          playbackProgress: {
            currentTime: progress.currentTime,
            lastWatchedAt: progress.lastWatchedAt,
            sessionModelType: progress.sessionModelType,
            progressId: progress._id,
          },
          sessionType: sessionTypeName, // Add general session type for frontend
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      message: "Got watched sessions successfully",
      data: watchedSessions,
      totalCount: watchedSessions.length,
    });
  } catch (error) {
    console.error("Error in getWatchedSessions:", error);
    return res.status(500).json({
      message: "Error in getting watched sessions",
      error: error.message,
    });
  }
}

async function updateSession(req, res) {
  try {
    let sessionFound = false;
    let Model;
    let updateData;
    let validationError;
    let validatedValue;

    let imageUrl_1920x1080 =
      req.files && req.files["image1920x1080"]
        ? `/uploads/${req.files["image1920x1080"][0].filename}`
        : req.body?.imageUrl_1920x1080 || null;
    let imageUrl_522x760 =
      req.files && req.files["image522x760"]
        ? `/uploads/${req.files["image522x760"][0].filename}`
        : req.body?.imageUrl_522x760 || null;

    if (req.files && req.files["image1920x1080"]) {
      const filePath = `uploads/${req.files["image1920x1080"][0].filename}`;
      const isValid = await validateAspectRatio(filePath, 1920, 1080);
      if (!isValid) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          message: "Image 1920x1080 must have aspect ratio 16:9 (1920x1080)",
        });
      }
    }
    if (req.files && req.files["image522x760"]) {
      const filePath = `uploads/${req.files["image522x760"][0].filename}`;
      const isValid = await validateAspectRatio(filePath, 522, 760);
      if (!isValid) {
        fs.unlinkSync(filePath);
        return res
          .status(400)
          .json({ message: "Image 522x760 must have aspect ratio 522:760" });
      }
    }

    const commonUpdateData = {
      title: req.body?.title,
      description: req.body?.description,
      moduleName: req.body?.moduleName,
      pathologyName: req.body?.pathologyName,
      pathologyId: req.body?.pathologyId,
      difficulty: req.body?.difficulty,
      isFree: req.body?.isFree,
      sponsored: req.body?.sponsored,
      imageUrl_1920x1080,
      imageUrl_522x760,
      startDate: req.body?.startDate,
      endDate: req.body?.endDate,
      startTime: req.body?.startTime,
      endTime: req.body?.endTime,
      resourceLinks: req.body?.resourceLinks,
      faculty: req.body?.faculty,
    };

    if (req.query.sessionType === "Dicom") {
      Model = DicomCases;
      updateData = {
        ...commonUpdateData,
        isAssessment: req.body?.isAssessment,
        dicomStudyId: req.body?.dicomStudyId,
        dicomCaseId: req.body?.dicomCaseId,
        dicomCaseVideoUrl: req.body?.dicomCaseVideoUrl,
        caseAccessType: req.body?.caseAccessType,
        sessionType: req.body?.sessionType,
      };
      ({ error: validationError, value: validatedValue } =
        DicomCases.validateUser(updateData));
    } else if (req.query.sessionType === "Vimeo") {
      Model = RecordedLectures;
      updateData = {
        ...commonUpdateData,
        sessionDuration: req.body?.sessionDuration,
        vimeoVideoId: req.body?.vimeoVideoId,
        videoUrl: req.body?.videoUrl,
        videoType: req.body?.videoType,
        sessionType: req.body?.sessionType,
        isAssessment: req.body?.isAssessment,
      };
      ({ error: validationError, value: validatedValue } =
        RecordedLectures.validateUser(updateData));
    } else if (req.query.sessionType === "Live") {
      Model = LivePrograms;
      updateData = {
        ...commonUpdateData,
        sessionType: req?.body?.liveProgramType,
        zoomMeetingId: req?.body?.zoomMeetingId,
        zoomJoinUrl: req?.body?.zoomJoinUrl,
        zoomStartUrl: req?.body?.zoomStartUrl,
        vimeoVideoId: req?.body?.vimeoVideoId,
        vimeoLiveUrl: req?.body?.vimeoLiveUrl,
      };
      ({ error: validationError, value: validatedValue } =
        LivePrograms.validateProgram(updateData));
    } else {
      return res
        .status(400)
        .json({ message: "Invalid session type provided for update." });
    }

    if (validationError) {
      return res.status(400).json({
        message: "Validation error",
        details: validationError.details,
      });
    }

    const updatedDoc = await Model.findByIdAndUpdate(
      req.query.id,
      validatedValue,
      { new: true }
    );

    if (updatedDoc) {
      sessionFound = true;
    } else {
      return res.status(404).json({ message: "Session not found for update." });
    }

    if (sessionFound) {
      res
        .status(200)
        .json({ message: "Updated Session Successfully", data: updatedDoc });
    } else {
      res
        .status(500)
        .json({ message: "Couldn't update session (unknown error)." });
    }
  } catch (error) {
    console.error("Error in updating session:", error);
    return res.status(500).json({
      message: "Error in updating session",
      response: error.message,
    });
  }
}

async function updateSessionFaculties(req, res) {
  try {
    const { sessionId, sessionType } = req.params;
    const { facultyIds } = req.body;

    if (!sessionId || !sessionType || !Array.isArray(facultyIds)) {
      return res.status(400).json({
        message:
          "Session ID, session Type, and an array of facultyIds are required.",
      });
    }

    let sessionModel;
    if (sessionType.toLowerCase() === "dicom") {
      sessionModel = DicomCases;
    } else if (sessionType.toLowerCase() === "vimeo") {
      sessionModel = RecordedLectures;
    } else if (sessionType.toLowerCase() === "live") {
      sessionModel = LivePrograms;
    } else {
      return res.status(400).json({
        message:
          "Invalid session type provided. Must be 'Dicom', 'Vimeo', or 'Live'.",
      });
    }

    const session = await sessionModel.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    session.faculty = facultyIds;
    await session.save();

    res.status(200).json({
      message: "Session faculties updated successfully.",
      data: session,
    });
  } catch (error) {
    console.error("Error in updateSessionFaculties:", error);
    res.status(500).json({
      message: "Couldn't update session faculties.",
      error: error.message,
    });
  }
}

async function getUpcomingLivePrograms(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const now = new Date();

    const populateFacultyQuery = { path: "faculty", select: "name image" };

    const upcomingPrograms = await LivePrograms.find({
      startDate: { $gte: now },
    })
      .populate(populateFacultyQuery)
      .sort({
        startDate: 1,
      })
      .limit(limit);

    return res.status(200).json({
      message: `Got ${upcomingPrograms.length} upcoming live programs successfully`,
      data: upcomingPrograms,
    });
  } catch (error) {
    console.error("Error in getUpcomingLivePrograms:", error);
    return res.status(500).json({
      message: "Error in getting upcoming live programs",
      error: error.message,
    });
  }
}

async function deleteSession(req, res) {
  try {
    const { sessionId, sessionType } = req.query;

    if (!sessionId || !sessionType) {
      return res
        .status(400)
        .json({ message: "Session ID and type are required" });
    }

    let deletedSession;
    if (sessionType === "Dicom") {
      deletedSession = await DicomCases.findByIdAndDelete(sessionId);
    } else if (sessionType === "Vimeo") {
      deletedSession = await RecordedLectures.findByIdAndDelete(sessionId);
    } else if (sessionType === "Live") {
      deletedSession = await LivePrograms.findByIdAndDelete(sessionId);
    } else {
      return res.status(400).json({ message: "Invalid session type" });
    }

    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error in deleting session:", error);
    res.status(500).json({
      message: "Error in deleting session",
      error: error.message,
    });
  }
}

async function generateZoomSignature(req, res) {
  try {
    const apiKey = process.env.ZOOM_API_KEY;
    const apiSecret = process.env.ZOOM_API_SECRET;
    const meetingNumber = req.query.meetingNumber;
    const role = req.query.role;

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const payload = {
      sdkKey: apiKey,
      mn: meetingNumber,
      role: role,
      iat: iat,
      exp: exp,
      tokenExp: exp,
    };

    const token = jwt.sign(payload, apiSecret, { algorithm: "HS256" });
    res
      .status(200)
      .json({ message: "Generated Signature Successfully", signature: token });
  } catch (error) {
    return res.status(500).json({
      message: "Error in Signature Generation",
      error: error,
    });
  }
}

async function trackSessionView(req, res) {
  try {
    let data = await UserSessionView.findOneAndUpdate(
      {
        userId: req?.query?.userId,
        sessionId: req?.query?.sessionId,
        moduleId: req?.query?.moduleId,
      },
      { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
      { upsert: true, new: true }
    );
    return res.status(200).json({
      message: "Session views updated successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error in trackSessionView:", error);
    return res.status(500).json({
      message: "Error in tracking session view",
      error: error.message,
    });
  }
}

async function generateAIComparison(req, res) {
  try {
    const { userObservations, facultyObservations } = req.body;

    if (!userObservations || !facultyObservations) {
      return res.status(400).json({
        message: "Both userObservations and facultyObservations are required",
      });
    }

    const prompt = `
You are a clinical AI assistant. Compare the following user and faculty observations and return a 
well-structured **HTML report** (no markdown, only HTML).  

Use this structure:
<div class="section">
  <h3>1. Summary of Key Differences</h3>
  <p>...</p>
</div>
<div class="section">
  <h3>2. Areas of Agreement</h3>
  <p>...</p>
</div>
<div class="section">
  <h3>3. Suggestions for Improvement (for user)</h3>
  <ul>
    <li>...</li>
  </ul>
</div>
<div class="section">
  <h3>4. Overall Evaluation</h3>
  <p>...</p>
</div>

Keep the output clean, readable, and professional. Include line spacing and paragraph breaks.
Avoid repeating titles or adding markdown symbols.

User Observations:
${userObservations}

Faculty Observations:
${facultyObservations}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const htmlReport = response.choices[0].message.content;
    res.status(200).json({ report: htmlReport });
  } catch (error) {
    console.error("Error in generateAIComparison:", error);
    res.status(500).json({
      message: "Error in generating AI comparison",
      error: error.message,
    });
  }
}

module.exports = {
  createSession,
  getSessions,
  updateSession,
  deleteSession,
  getTopRatedCases,
  getTopRatedLectures,
  getRecentItems,
  trackSessionView,
  getTopWatchedSessions,
  getWatchedSessions,
  updateSessionFaculties,
  getUpcomingLivePrograms,
  getSessionsByDifficulty,
  getCompletedSessionsByUsers,
  generateZoomSignature,
  generateAIComparison,
  // You might want to add specific LiveProgram methods later if needed, e.g., getLiveProgramById
};
