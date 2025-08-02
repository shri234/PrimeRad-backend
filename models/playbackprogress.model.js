// models/playbackprogress.model.js
const mongoose = require("mongoose");
const Joi = require("joi"); // For validation

const playbackProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to your User model (assuming you have one)
      required: true,
      index: true, // Index for faster lookups by user
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // This will store the _id of either a DicomCase or RecordedLecture
      index: true, // Index for faster lookups by session
    },
    sessionModelType: {
      // To know which collection to look up if needed, e.g., 'DicomCase' or 'RecordedLecture'
      type: String,
      required: true,
      enum: ["DicomCase", "RecordedLecture"], // Ensure this matches your model names
    },
    currentTime: {
      type: Number, // Stored in seconds
      default: 0,
      min: 0,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for sorting 'continue watching' by most recent
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Add a compound unique index to ensure one progress record per user per session
playbackProgressSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

// Joi validation schema for incoming data
function validatePlaybackProgress(progress) {
  const schema = Joi.object({
    userId: Joi.string().required(), // Assuming userId is a string before Mongoose conversion
    sessionId: Joi.string().required(), // Assuming sessionId is a string before Mongoose conversion
    sessionModelType: Joi.string()
      .valid("DicomCase", "RecordedLecture")
      .required(),
    currentTime: Joi.number().min(0).required(),
  });
  return schema.validate(progress);
}

const PlaybackProgress = mongoose.model(
  "PlaybackProgress",
  playbackProgressSchema
);

module.exports = {
  PlaybackProgress,
  validatePlaybackProgress,
};
