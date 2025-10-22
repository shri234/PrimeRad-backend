const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "modules",
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    trim: true,
    default: "beginner",
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    // required: true,
    trim: true,
  },
  options: {
    a: { type: String, required: true },
    b: { type: String, required: true },
    c: { type: String, required: true },
    d: { type: String, required: true },
  },
  correctAnswer: {
    type: String,
    required: true,
    enum: ["a", "b", "c", "d"],
  },
  image: {
    type: String,
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assessment", assessmentSchema);
