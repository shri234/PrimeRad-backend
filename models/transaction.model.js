const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package", // Or your Package model name
      required: true,
    },
    packageName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "INR", // Or 'USD' based on your currency
    },
    paymentGateway: {
      type: String,
      required: true,
      enum: ["paypal", "razorpay", "stripe"],
    },
    gatewayOrderId: {
      // PayPal's Order ID (or Razorpay/Stripe equivalent)
      type: String,
      required: true,
      unique: true,
    },
    gatewayPaymentId: {
      // PayPal's Capture ID (or Razorpay payment_id)
      type: String,
      unique: true,
      sparse: true, // Allows null values, but still unique if present
    },
    status: {
      type: String,
      enum: ["created", "approved", "captured", "failed", "cancelled"],
      default: "created",
    },
    // Store relevant data from PayPal response for debugging
    paypalResponse: {
      type: mongoose.Schema.Types.Mixed, // Stores a flexible object
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
