const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const UserVideoObservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dicomcases",
    required: true,
  },
  observationResults: [
    {
      observationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Observation",
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
    },
  ],
  totalCorrect: {
    type: Number,
    default: 0,
  },
  totalAttempts: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
    default: Date.now(),
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model(
  "UserVideoObservation",
  UserVideoObservationSchema
);
