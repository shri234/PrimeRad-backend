const Razorpay = require("razorpay");
const Package = require("../models/package.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const paypal = require("@paypal/checkout-server-sdk");
const crypto = require("crypto");
const PaymentTransaction = require("../models/transaction.model");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

let environment;
if (process.env.PAYPAL_MODE === "live") {
  environment = new paypal.core.LiveEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
} else {
  // Default to sandbox
  environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  );
}

const payPalClient = new paypal.core.PayPalHttpClient(environment);

async function createPayPalOrder(req, res) {
  try {
    // Authenticated user ID (from req.user.id set by your auth middleware)
    // Note: You had req.query.userId, but for authenticated routes, it's typically req.user.id from the token
    const userId = req.query.userId;
    const { packageId, amount, currency, packageName } = req.body; // Data from frontend

    if (!packageId || !amount || !currency || !packageName || amount <= 0) {
      return res.status(400).json({
        message:
          "Missing or invalid payment details (packageId, amount, currency, packageName).",
      });
    }

    // 1. Construct the PayPal Order Request Body for the new SDK
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation"); // Optional: Get full representation in response
    request.requestBody({
      intent: "CAPTURE", // We intend to capture the payment immediately after approval
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2), // Amount must be a string with 2 decimal places
          },
          description: `Subscription for ${packageName} plan (User: ${userId})`,
          custom_id: packageId.toString(), // Custom field to link to your packageId
          soft_descriptor: "PRIMERAD SUBSCRIPTION", // Text shown on buyer's credit card statement
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        brand_name: "PRIMERAD",
        user_action: "PAY_NOW",
        landing_page: "BILLING",
      },
    });

    // 2. Execute the request to create the Order using the new client
    const orderResponse = await payPalClient.execute(request);
    const order = orderResponse.result;
    // console.log(order); // The created PayPal Order object

    // Find the approval URL (link with rel="approve") for frontend redirection
    const approvalUrl = order.links.find(
      (link) => link.rel === "approve"
    )?.href;

    if (!approvalUrl) {
      console.error("PayPal: No approval URL found in order response.", order);
      return res
        .status(500)
        .json({ message: "Failed to get PayPal approval URL." });
    }

    // 3. Store the payment transaction in your database (status: 'created')
    const transaction = await PaymentTransaction.create({
      userId: userId,
      packageId: packageId,
      packageName: packageName,
      amount: Number(amount), // Store as number
      currency: currency,
      paymentGateway: "paypal",
      gatewayOrderId: order.id, // PayPal's unique order ID
      status: order.status.toLowerCase(), // e.g., 'CREATED' -> 'created'
      paypalResponse: order, // Store full initial response for debugging
    });

    res.status(200).json({
      message: "PayPal order created successfully",
      orderId: order.id, // Send PayPal's Order ID to frontend
      approvalUrl: approvalUrl,
    });
  } catch (err) {
    // Handle PayPal API errors
    // The new SDK provides more detailed error structures (e.statusCode, err.response.details)
    console.error(
      "Error in createPayPalOrder:",
      err.statusCode,
      err.message,
      err.response ? JSON.stringify(err.response.details) : ""
    );
    res.status(err.statusCode || 500).json({
      message:
        err.message || "Internal server error during PayPal order creation.",
      details: err.response?.details || null,
    });
  }
}

async function capturePayPalPayment(req, res) {
  try {
    // PayPal redirects to this URL with 'token' (which is the Order ID created by PayPal) and 'PayerID'
    const { token, PayerID } = req.query; // 'token' is the Order ID from the initial create step
    console.log(token, PayerID);
    if (!token || !PayerID) {
      console.warn(
        "Missing PayPal token (Order ID) or PayerID in query. Redirecting to payment-failed."
      );
      // return res.redirect(
      //   `${process.env.FRONTEND_URL}/payment-failed?status=missing_params`
      // );
    }

    const pendingTransaction = await PaymentTransaction.findOne({
      gatewayOrderId: token, // This is the order ID created by PayPal, which the token matches
      paymentGateway: "paypal",
      status: "created", // Ensure we're only capturing orders that were initiated
    });
    console.log(pendingTransaction);
    if (!pendingTransaction) {
      console.error(
        `PayPal capture failed: No pending transaction found for Order ID: ${token}`
      );
      // return res.redirect(
      //   `${process.env.FRONTEND_URL}/payment-failed?status=not_found&orderId=${token}`
      // );
    }

    // 2. Execute the request to capture the Order using the new client
    // PayerID is implicitly used by PayPal for authentication/verification within this API call context
    const request = new paypal.orders.OrdersCaptureRequest(token);
    console.log("here", request); // Use the Order ID (token) to capture
    // request.prefer("return=representation"); // Optional: Get full representation in response

    const captureResponse = await payPalClient.execute(request);
    console.log(captureResponse, "captured");
    const order = captureResponse.result;

    console.log("order", order); // The captured PayPal Order object

    // 3. Process the capture result based on the order status
    if (
      order.status === "COMPLETED" ||
      order.status === "APPROVED" ||
      order.status === "CAPTURED"
    ) {
      // 'COMPLETED' is the typical final status for CAPTURE intent
      // Update the transaction in your database to 'captured'
      pendingTransaction.status = "captured";
      // Get the actual capture ID which is nested in the response for 'CAPTURE' intent
      pendingTransaction.gatewayPaymentId =
        order.purchase_units[0]?.payments?.captures?.[0]?.id;
      pendingTransaction.paypalResponse = order; // Store final response for debugging
      await pendingTransaction.save();

      // Retrieve package and user details from the pending transaction for reliability
      const pkg = await Package.findById(pendingTransaction.packageId);
      const user = await User.findById(pendingTransaction.userId);

      if (!pkg || !user) {
        console.error(
          `Missing package or user data for captured PayPal order: ${token}. Package ID: ${pendingTransaction.packageId}, User ID: ${pendingTransaction.userId}`
        );
        return res.redirect(
          `${process.env.FRONTEND_URL}/payment-failed?status=data_missing&orderId=${token}`
        );
      }

      // Calculate expiry date and create/update subscription
      let expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.duration); // Assuming pkg.duration is in days

      await Subscription.create({
        subscriberName: user.name,
        subscriberId: user._id,
        packageName: pkg.packageName,
        packageId: pkg._id,
        expiryDate: expiryDate,
        paymentId: pendingTransaction.gatewayPaymentId, // Use PayPal's actual capture ID
        transactionId: pendingTransaction._id, // Link to your internal transaction record
        paymentGateway: "paypal",
      });

      // Redirect to the frontend's success page
      return res.redirect(
        `${process.env.FRONTEND_URL}/subscription-success?status=success&orderId=${token}`
      );
    } else {
      // Payment was not completed (e.g., 'PENDING', 'VOIDED', 'FAILED', or other non-final statuses)
      console.error(
        "PayPal Order not in COMPLETED/APPROVED/CAPTURED state:",
        order.status,
        order.id
      );
      pendingTransaction.status = order.status.toLowerCase(); // Update with PayPal's status
      pendingTransaction.paypalResponse = order;
      await pendingTransaction.save();
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failed?status=failed&orderStatus=${order.status}&orderId=${token}`
      );
    }
  } catch (err) {
    // Handle API errors during capture
    // The new SDK provides more detailed error structures (err.statusCode, err.response.details)
    console.error(
      "Error in capturePayPalPayment:",
      err.statusCode,
      err.message,
      err.response ? JSON.stringify(err.response.details) : ""
    );
    res.redirect(
      `${process.env.FRONTEND_URL}/payment-failed?status=error&orderId=${
        req.query.token || "N/A"
      }&message=${encodeURIComponent(err.message)}`
    );
  }
}

async function createPackages(req, res) {
  try {
    let durationInDays;
    const durationUnit = req?.body?.durationUnit;

    switch (durationUnit) {
      case "monthly":
        durationInDays = 30;
        break;
      case "yearly":
        durationInDays = 365;
        break;
      case "biannually":
        durationInDays = 180;
        break;
      default:
        return res.status(400).json({ message: "Invalid durationUnit" });
    }

    const createPackage = await Package.create({
      packageName: req.body?.packageName,
      amount: Number(req.body?.amount),
      durationUnit: durationUnit,
      duration: durationInDays,
    });

    return res.status(201).json({
      message: "Package created successfully",
      data: createPackage,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Couldn't create package",
      response: err.message,
    });
  }
}
async function initiatePayment(req, res) {
  try {
    // const token =
    //   req.cookies?.jwt || req.headers["authorization"]?.split(" ")[1];
    // const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // const user = await User.findById(decoded._id);

    const getPackage = await Package.findById(req?.query?.packageId);

    if (!getPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    const order = await razorpayInstance.orders.create({
      amount: getPackage.amount * 100,
      currency: "INR",
      receipt: `receipt_${getPackage._id}`,
    });

    res.status(200).json({
      message: "Payment initiation successful",
      orderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      amount: getPackage.amount,
      currency: "INR",
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Payment initiation failed", error: err.message });
  }
}
async function handlePaymentWebhook(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const payload = JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    const isValid = Razorpay.validateWebhookSignature(
      payload,
      signature,
      webhookSecret
    );

    if (!isValid) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const payment = req?.body?.payload?.payment?.entity;

    if (payment.status === "captured") {
      const { notes } = payment;
      const user = await User.findById(notes.userId);
      const package = await Package.findById(notes.packageId);
      let expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + package.duration);

      if (!transaction) {
        // Create transaction if it doesn't exist (e.g., if frontend verification failed/was skipped)
        transaction = await PaymentTransaction.create({
          userId: user._id,
          packageId: package._id,
          packageName: package.packageName,
          amount: payment.amount / 100, // Razorpay amount is in smallest unit
          currency: payment.currency,
          paymentGateway: "razorpay",
          gatewayOrderId: payment.order_id,
          gatewayPaymentId: payment.id,
          status: "captured",
          razorpayResponse: payment, // Store the full payment entity
        });
      } else {
        // Update existing transaction status
        transaction.status = "captured";
        transaction.razorpayResponse = payment;
        await transaction.save();
      }

      const subscription = await Subscription.create({
        subscriberName: user.name,
        subscriberId: user._id,
        packageName: package.packageName,
        packageId: package._id,
        expiryDate: expiryDate,
        paymentId: payment.id,
      });

      res.status(200).json({
        message: "Payment successful and subscription created",
        subscription,
      });
    } else {
      res.status(400).json({ message: "Payment failed" });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Webhook handling failed", error: err.message });
  }
}

async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      packageId,
    } = req.body;

    // Verify the signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Store failed transaction
      await PaymentTransaction.create({
        userId: userId,
        packageId: packageId, // Ensure these are passed from frontend or fetched
        packageName: "UNKNOWN", // Update with actual package name if available
        amount: 0, // Update with actual amount
        currency: "INR",
        paymentGateway: "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        status: "failed",
        razorpayResponse: req.body, // Store the response received
      });
      return res
        .status(400)
        .json({ message: "Payment verification failed: Signature mismatch" });
    }

    const paymentDetails = await razorpayInstance.payments.fetch(
      razorpay_payment_id
    );

    if (paymentDetails.status === "captured") {
      const user = await User.findById(userId);
      const package = await Package.findById(packageId);
      W;

      if (!user || !package) {
        return res
          .status(404)
          .json({ message: "User or Package not found during verification." });
      }

      let expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + package.duration);

      const subscription = await Subscription.create({
        subscriberName: user.name,
        subscriberId: user._id,
        packageName: package.packageName,
        packageId: package._id,
        expiryDate: expiryDate,
        paymentId: paymentDetails.id, // Razorpay payment ID
      });

      // Store successful transaction
      await PaymentTransaction.create({
        userId: user._id,
        packageId: package._id,
        packageName: package.packageName,
        amount: paymentDetails.amount / 100, // Razorpay amount is in smallest unit
        currency: paymentDetails.currency,
        paymentGateway: "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        status: "captured",
        razorpayResponse: paymentDetails, // Store the full Razorpay payment object
      });

      res.status(200).json({
        message: "Payment successful and subscription created",
        subscription,
      });
    } else {
      // Payment not captured (e.g., failed, authorized but not captured)
      await PaymentTransaction.create({
        userId: userId,
        packageId: packageId,
        packageName: package.packageName, // Make sure you have this
        amount: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        paymentGateway: "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        status: paymentDetails.status, // Store the actual status
        razorpayResponse: paymentDetails,
      });
      res
        .status(400)
        .json({ message: `Payment not captured: ${paymentDetails.status}` });
    }
  } catch (err) {
    console.error("Error in verifyPayment:", err);
    res
      .status(500)
      .json({ message: "Payment verification failed", error: err.message });
  }
}

async function getPackages(req, res) {
  try {
    let getPackage = await Package.find({});

    return res.status(200).json({
      message: "Packages fetched Successfully",
      data: getPackage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching packages",
      response: error,
    });
  }
}

async function getPackageById(req, res) {
  try {
    let packageId = req?.query?.packageId;
    let getPackage = await Package.findById(packageId);

    return res.status(200).json({
      message: "Packages fetched Successfully",
      data: getPackage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching packages",
      response: error,
    });
  }
}

module.exports = {
  createPackages,
  initiatePayment,
  handlePaymentWebhook,
  getPackages,
  getPackageById,
  createPayPalOrder,
  capturePayPalPayment,
  verifyPayment,
};
