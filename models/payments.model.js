const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const PaymentsSchema = new mongoose.Schema({
  paymentType: {
    type: String,
    trim: true,
    require: true,
  },

  subscriberId: {
    type: String,
    require: true,
  },

  paymentDate: {
    type: Date,
    default: Date.now,
  },

  paymentStatus: {
    type: String,
    default: "Pending",
  },

  invoiceNumber: {
    type: Number,
    unique: true,
  },

  totalAmount: {
    type: Number,
    default: 0,
  },

  taxAmount: {
    type: Number,
    default: 0,
  },

  currency: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const joiPaymentsSchema = Joi.object({
  packageName: Joi.string().required(),
  description: Joi.string(),
});

PaymentsSchema.statics.validateUser = function (userData) {
  return joiPaymentsSchema.validate(userData, { abortEarly: false });
};

module.exports = mongoose.model("Payments", PaymentsSchema);
