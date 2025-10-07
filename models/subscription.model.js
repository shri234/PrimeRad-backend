const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const SubscriptionSchema = new mongoose.Schema({
  subscriberName: {
    type: String,
    trim: true,
    require: true,
    unique: true,
  },
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  packageName: {
    type: String,
    default: null,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
  },
  subscriptionStatus: {
    type: String,
    trim: true,
    default: "Subscribed",
  },
  subscriptionDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiSubscriptionSchema = Joi.object({
  packageName: Joi.string().required(),
  description: Joi.string(),
});

SubscriptionSchema.statics.validateUser = function (userData) {
  return joiSubscriptionSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("subscription", SubscriptionSchema);
