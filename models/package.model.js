const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const PackageSchema = new mongoose.Schema({
  packageName: {
    type: String,
    trim: true,
    require: true,
  },
  amount: {
    type: Number,
    require: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  durationUnit: {
    type: String,
    trim: true,
    enum: ["monthly", "yearly", "biannually"],
    default: "monthly",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiPackageSchema = Joi.object({
  packageName: Joi.string().required(),
  description: Joi.string(),
});

PackageSchema.statics.validateUser = function (userData) {
  return joiPackageSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("Package", PackageSchema);
