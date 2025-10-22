const mongoose = require("mongoose");

const userAssessmentProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    attempts: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assessment",
        },
        selectedAnswer: { type: String },
        isCorrect: { type: Boolean },
        answeredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "UserAssessmentProgress",
  userAssessmentProgressSchema
);
