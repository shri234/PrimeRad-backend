const mongoose = require("mongoose");
const Joi = require("joi");

const PathologySchema = new mongoose.Schema({
  pathologyName: {
    type: String,
    trim: true,
    require: true,
  },

  description: {
    type: String,
    default: null,
  },

  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
  },

  imageUrl: {
    type: String,
    default: null,
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiPathologySchema = Joi.object({
  pathologyName: Joi.string().required(),
  moduleId: Joi.string().required(),
  description: Joi.string(),
});

PathologySchema.statics.validateUser = function (userData) {
  return joiPathologySchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("Pathology", PathologySchema);
