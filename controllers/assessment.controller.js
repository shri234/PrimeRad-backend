const Assessment = require("../models/assessment.model");
const UserAssessmentProgress = require("../models/userassessmentprogress.model");
const { upload } = require("../config/uploadImage");
const mongoose = require("mongoose");

// Create a new assessment question
async function createAssessment(req, res) {
  try {
    const { module, question, description, options, correctAnswer } = req.body;
    const image = req.file ? req.file.path : null;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newAssessment = new Assessment({
      module,
      question,
      description,
      options: JSON.parse(options),
      correctAnswer,
      image,
    });

    await newAssessment.save();
    res.status(201).json({
      message: "Assessment question created successfully",
      data: newAssessment,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create assessment question", error: err });
  }
}

// Get all assessment questions
async function getAllAssessments(req, res) {
  try {
    const assessments = await Assessment.find();
    res.status(200).json({ data: assessments });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve assessment questions",
      error: err,
    });
  }
}

// Get a single assessment question by ID
async function getAssessmentById(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.id).populate(
      "session"
    );
    if (!assessment) {
      return res.status(404).json({ message: "Assessment question not found" });
    }
    res.status(200).json({ data: assessment });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve assessment question",
      error: err,
    });
  }
}

async function getAssessmentByModule(req, res) {
  try {
    const assessment = await Assessment.find({ module: req.query.moduleId });
    console.log(assessment);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment question not found" });
    }
    res.status(200).json({ data: assessment });
  } catch (err) {
    res.status(500).json({
      message: "Failed to retrieve assessment question",
      error: err,
    });
  }
}

async function updateAssessment(req, res) {
  try {
    const { session, question, description, options, correctAnswer } = req.body;
    const image = req.file ? req.file.path : req.body.image;

    const updatedAssessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      {
        session,
        question,
        description,
        options: JSON.parse(options),
        correctAnswer,
        image,
      },
      { new: true }
    );

    if (!updatedAssessment) {
      return res.status(404).json({ message: "Assessment question not found" });
    }
    res.status(200).json({
      message: "Assessment question updated successfully",
      data: updatedAssessment,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update assessment question", error: err });
  }
}

async function deleteAssessment(req, res) {
  try {
    const deletedAssessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!deletedAssessment) {
      return res.status(404).json({ message: "Assessment question not found" });
    }
    res
      .status(200)
      .json({ message: "Assessment question deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete assessment question", error: err });
  }
}

async function submitAnswer(req, res) {
  try {
    const { userId, assessmentId, selectedAnswer } = req.body;
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return res.status(404).json({ message: "Question not found" });
    }

    const isCorrect = assessment.correctAnswer === selectedAnswer;
    const pointsEarned = isCorrect ? 5 : 0;

    let progress = await UserAssessmentProgress.findOne({
      userId,
      moduleId: assessment.module,
      difficulty: assessment.difficulty,
    });

    if (!progress) {
      progress = new UserAssessmentProgress({
        userId,
        moduleId: assessment.module,
        difficulty: assessment.difficulty,
        totalQuestions: 0,
        correctAnswers: 0,
        points: 0,
        attempts: [],
      });
    }

    progress.totalQuestions += 1;
    if (isCorrect) progress.correctAnswers += 1;
    progress.points += pointsEarned;

    progress.attempts.push({
      assessmentId,
      selectedAnswer,
      isCorrect,
    });

    await progress.save();

    res.status(200).json({
      message: "Answer submitted successfully",
      isCorrect,
      pointsEarned,
      totalPoints: progress.points,
    });
  } catch (err) {
    res.status(500).json({ message: "Error submitting answer", error: err });
  }
}

// Get top 10 users by points
async function getTopUsers(req, res) {
  try {
    const topUsers = await UserAssessmentProgress.aggregate([
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$points" },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users", // Your user collection name
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          totalPoints: 1,
        },
      },
    ]);

    res.status(200).json({ data: topUsers });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve top users", error: err });
  }
}

async function getUserPoints(req, res) {
  try {
    const userId = req?.query?.userId;
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let data = await UserAssessmentProgress.find({ userId: userId });
    console.log(data);
    const totalData = await UserAssessmentProgress.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$points" },
        },
      },
    ]);

    console.log(totalData);

    const totalPoints = totalData.length > 0 ? totalData[0].totalPoints : 0;

    // const moduleWise = await UserAssessmentProgress.aggregate([
    //   { $match: { userId } },
    //   {
    //     $group: {
    //       _id: "$moduleId",
    //       modulePoints: { $sum: "$points" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "modules", // Your module collection name
    //       localField: "_id",
    //       foreignField: "_id",
    //       as: "moduleDetails",
    //     },
    //   },
    //   { $unwind: { path: "$moduleDetails", preserveNullAndEmptyArrays: true } },
    //   {
    //     $project: {
    //       moduleId: "$_id",
    //       moduleName: "$moduleDetails.name",
    //       modulePoints: 1,
    //     },
    //   },
    // ]);

    res.status(200).json({
      totalPoints,
      // moduleWise,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to retrieve user points", error: err });
  }
}

module.exports = {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  submitAnswer,
  getAssessmentByModule,
  getTopUsers,
  getUserPoints,
};
