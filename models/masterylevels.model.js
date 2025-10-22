const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const MasteryLevelSchema = new mongoose.Schema({
  levelName: {
    type: String,
    trim: true,
    require: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
    default: null,
  },
  points: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiMasteryLevelsSchema = Joi.object({
  levelName: Joi.string().required(),
  description: Joi.string(),
  points: Joi.number().required(),
});

MasteryLevelSchema.statics.validateUser = function (userData) {
  return joiMasteryLevelsSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("Masterylevel", MasteryLevelSchema);
