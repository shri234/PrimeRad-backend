const mongoose = require("mongoose");
const Joi = require("joi");

const LiveProgramsSchema = new mongoose.Schema({
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
  pathologyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pathology",
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner",
  },
  isFree: {
    type: Boolean,
    default: false,
  },
  sponsored: {
    type: Boolean,
    default: false,
  },

  zoomMeetingId: {
    type: String,
    default: null,
  },
  zoomMeetingPassword: {
    type: String,
    default: null,
  },
  zoomJoinUrl: {
    type: String,
    default: null,
  },
  zoomBackUpLink: {
    type: String,
    default: null,
  },

  vimeoVideoId: {
    type: String,
    default: null,
  },
  vimeoLiveUrl: {
    type: String,
    default: null,
  },

  // Common live session fields
  sessionType: {
    type: String,
    enum: ["Zoom", "Vimeo"],
    default: "Zoom",
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
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    default: null,
  },
  endTime: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Joi Validation Schema
const joiLiveProgramSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(null, "").optional(),
  moduleName: Joi.string().required(),
  pathologyName: Joi.string().trim().optional(),
  pathologyId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  difficulty: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .default("beginner"),
  isFree: Joi.boolean().default(false),
  sponsored: Joi.boolean().default(false),

  // Zoom fields
  zoomMeetingId: Joi.string().allow(null, "").optional(),
  zoomJoinUrl: Joi.string().uri().allow(null, "").optional(),
  zoomStartUrl: Joi.string().uri().allow(null, "").optional(),

  // Vimeo fields
  vimeoVideoId: Joi.string().allow(null, "").optional(),
  vimeoLiveUrl: Joi.string().uri().allow(null, "").optional(),

  sessionType: Joi.string().valid("Zoom", "Vimeo").default("Zoom"),
  resourceLinks: Joi.string().allow(null, "").optional(),
  imageUrl_1920x1080: Joi.string().allow(null, "").optional(),
  imageUrl_522x760: Joi.string().allow(null, "").optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  startTime: Joi.string().allow(null, "").optional(),
  endTime: Joi.string().allow(null, "").optional(),
  facultyIds: Joi.array()
    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required(),
  createdAt: Joi.date().optional(),
});

LiveProgramsSchema.statics.validateProgram = function (programData) {
  return joiLiveProgramSchema.validate(programData, { abortEarly: false });
};

module.exports = mongoose.model("LivePrograms", LiveProgramsSchema);
