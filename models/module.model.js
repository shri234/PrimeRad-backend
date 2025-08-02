const mongoose = require("mongoose");
const Joi = require("joi");

const ModuleSchema = new mongoose.Schema({
  moduleName: {
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
  imageUrl: {
    type: String,
    trim: true,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiModuleSchema = Joi.object({
  moduleName: Joi.string().required(),
  description: Joi.string(),
});

ModuleSchema.statics.validateUser = function (userData) {
  return joiModuleSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("Module", ModuleSchema);
