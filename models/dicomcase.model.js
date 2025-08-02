const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const DicomCasesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  moduleName: {
    type: String,
    // required: true,
  },
  pathologyName: {
    type: String,
    trim: true,
  },
  pathologyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pathology",
  },
  faculty: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },
  ],
  difficulty: {
    type: String,
    required: true,
    trim: true,
    default: "intermediate",
  },
  isAssessment: {
    type: Boolean,
    default: false,
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  dicomStudyId: {
    type: String,
    require: true,
    default: null,
  },
  dicomCaseId: {
    type: String,
    require: true,
    default: null,
  },
  dicomCaseVideoUrl: {
    type: String,
    require: true,
    default: null,
  },
  caseAccessType: {
    type: String,
    default: "free",
  },
  resourceLinks: {
    type: String,
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
  views: {
    type: Number,
    default: 0,
  },
  sponsored: {
    type: Boolean,
    default: false,
  },
  sessionType: {
    type: String,
    default: "Dicom",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiDicomSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  moduleName: Joi.string().optional(),
  pathologyName: Joi.string().trim().optional(),
  pathologyId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  difficulty: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("intermediate"),
  isAssessment: Joi.boolean().default(false),
  isFree: Joi.boolean().default(false),
  dicomStudyId: Joi.string().allow(null, "").optional(),
  dicomCaseId: Joi.string().allow(null, "").optional(),
  dicomCaseVideoUrl: Joi.string().uri().allow(null, "").optional(),
  caseAccessType: Joi.string().valid("free", "paid").default("free"),
  resourceLinks: Joi.string().allow(null, "").optional(),
  imageUrl_1920x1080: Joi.string().allow(null, "").optional(),
  imageUrl_522x760: Joi.string().allow(null, "").optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  startTime: Joi.string().allow(null, "").optional(),
  endTime: Joi.string().allow(null, "").optional(),
  sponsored: Joi.boolean().default(false),
  sessionType: Joi.string().valid("Dicom", "Vimeo").default("Dicom"),
  createdAt: Joi.date().optional(),
});

DicomCasesSchema.statics.validateUser = function (userData) {
  return joiDicomSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("DicomCases", DicomCasesSchema);
