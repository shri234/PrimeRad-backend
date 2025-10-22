const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const RecordedLecturesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  moduleName: {
    type: String,
    required: true,
  },

  pathologyName: {
    type: String,
    trim: true,
  },
  faculty: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },
  ],
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
  },
  pathologyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pathology",
  },
  views: {
    type: Number,
    default: 0,
  },
  difficulty: {
    type: String,
    required: true,
    trim: true,
    default: "beginner",
  },
  isAssessment: {
    type: Boolean,
    default: false,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  resourceLinks: {
    type: String,
    default: null,
  },
  sessionDuration: {
    type: String,
    default: null,
  },
  vimeoVideoId: {
    type: String,
    require: true,
    default: null,
  },
  videoUrl: {
    type: String,
    require: true,
    default: null,
  },
  videoType: {
    type: String,
    require: true,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  imageUrl_1920x1080: {
    type: String,
    default: null,
  },
  imageUrl_522x760: {
    type: String,
    default: null,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: Date.now,
  },
  startTime: {
    type: String,
    default: null,
  },
  endTime: {
    type: String,
    default: null,
  },
  sponsored: {
    type: Boolean,
    default: false,
  },
  sessionType: {
    type: String,
    default: "Vimeo",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiRecordedlectureSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  moduleName: Joi.string().required(),
  pathologyName: Joi.string().trim().optional(),
  moduleId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  pathologyId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  difficulty: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("beginner"),
  isAssessment: Joi.boolean().default(false),
  isFree: Joi.boolean().default(false),
  resourceLinks: Joi.string().allow(null, "").optional(),
  sessionDuration: Joi.string().allow(null, "").optional(),
  vimeoVideoId: Joi.string().allow(null, "").optional(),
  videoUrl: Joi.string().uri().allow(null, "").optional(),
  videoType: Joi.string().allow(null, "").optional(),
  imageUrl_1920x1080: Joi.string().allow(null, "").optional(),
  imageUrl_522x760: Joi.string().allow(null, "").optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  startTime: Joi.string().allow(null, "").optional(),
  endTime: Joi.string().allow(null, "").optional(),
  sponsored: Joi.boolean().default(false),
  sessionType: Joi.string().valid("Dicom", "Vimeo").default("Vimeo"),
  createdAt: Joi.date().optional(),
  facultyIds: Joi.array()
    .items(
      Joi.string().regex(/^[0-9a-fA-F]{24}$/) // Valid MongoDB ObjectId
    )
    .min(1), // at least one faculty
  // .required(),
});

RecordedLecturesSchema.statics.validateUser = function (userData) {
  return joiRecordedlectureSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("RecordedLectures", RecordedLecturesSchema);
