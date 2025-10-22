const express = require("express");
const router = express.Router();
const upload = require("../config/uploadImage");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  initiatePayment,
  createPackages,
  handlePaymentWebhook,
  getPackages,
  getPackageById,
  createPayPalOrder,
  capturePayPalPayment,
  verifyPayment,
  //   updateSession,
} = require("../controllers/subscription.controller");

router.post(
  "/initiatePayment",
  // authMiddleware,
  initiatePayment
);
router.post("/createPackage", authMiddleware, createPackages);
router.post(
  "/webhook",
  // authMiddleware,
  handlePaymentWebhook
);
router.post(
  "/verify-payment",
  // authMiddleware,
  verifyPayment
);
router.get(
  "/get",
  // authMiddleware
  getPackages
);
router.get(
  "/getPackageById",
  // authMiddleware
  getPackageById
);
router.post("/paypal-order", createPayPalOrder); // Create PayPal order
router.get("/paypal-verify", capturePayPalPayment);

module.exports = router;
