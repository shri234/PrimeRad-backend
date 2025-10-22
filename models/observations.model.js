const mongoose = require("mongoose");
const Joi = require("joi");

const { ObjectId } = mongoose.Schema.Types;

const ObservationSchema = new mongoose.Schema({
  observations: [
    {
      observationText: {
        type: String,
        trim: true,
        require: true,
      },
      facultyObservation: {
        type: String,
        trim: true,
        require: true,
      },
    },
  ],
  Module: {
    type: String,
    required: true,
  },
  sessionName: {
    type: String,
    default: null,
  },
  sessionId: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiObservationSchema = Joi.object({
  observationText: Joi.string().trim().required(),
  isCorrect: Joi.boolean(),
  points: Joi.number().integer().min(0),
  subscriptionType: Joi.string().valid("monthly", "yearly", "biannually"),
  resource_id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
});

ObservationSchema.statics.validateObservation = function (observationData) {
  return joiObservationSchema.validate(observationData, { abortEarly: false });
};

module.exports = mongoose.model("Observation", ObservationSchema);
