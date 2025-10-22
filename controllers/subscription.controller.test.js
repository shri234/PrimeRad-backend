// Mock all modules BEFORE requiring the controller
jest.mock("razorpay");
jest.mock("@paypal/checkout-server-sdk");
jest.mock("../models/package.model");
jest.mock("../models/subscription.model");
jest.mock("../models/user.model");
jest.mock("../models/transaction.model");
jest.mock("jsonwebtoken");
jest.mock("crypto");

const Razorpay = require("razorpay");
const paypal = require("@paypal/checkout-server-sdk");
const Package = require("../models/package.model");
const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const PaymentTransaction = require("../models/transaction.model");
const crypto = require("crypto");

const {
  createPackages,
  initiatePayment,
  handlePaymentWebhook,
  getPackages,
  getPackageById,
  createPayPalOrder,
  capturePayPalPayment,
  verifyPayment,
} = require("../controllers/subscription.controller");

describe("Payment Controller", () => {
  let req, res, mockRazorpayInstance, mockPayPalClient;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };

    // Mock Razorpay instance
    mockRazorpayInstance = {
      orders: {
        create: jest.fn(),
      },
      payments: {
        fetch: jest.fn(),
      },
    };

    Razorpay.mockImplementation(() => mockRazorpayInstance);
    Razorpay.validateWebhookSignature = jest.fn();

    // Mock PayPal client
    mockPayPalClient = {
      execute: jest.fn(),
    };

    paypal.core = {
      LiveEnvironment: jest.fn(),
      SandboxEnvironment: jest.fn(),
      PayPalHttpClient: jest.fn(() => mockPayPalClient),
    };

    paypal.orders = {
      OrdersCreateRequest: jest.fn(),
      OrdersCaptureRequest: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("createPackages", () => {
    it("should create a monthly package successfully", async () => {
      const mockPackage = {
        _id: "pkg123",
        packageName: "Basic Plan",
        amount: 100,
        durationUnit: "monthly",
        duration: 30,
      };

      req.body = {
        packageName: "Basic Plan",
        amount: 100,
        durationUnit: "monthly",
      };

      Package.create.mockResolvedValue(mockPackage);

      await createPackages(req, res);

      expect(Package.create).toHaveBeenCalledWith({
        packageName: "Basic Plan",
        amount: 100,
        durationUnit: "monthly",
        duration: 30,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Package created successfully",
        data: mockPackage,
      });
    });

    it("should create a yearly package successfully", async () => {
      const mockPackage = {
        _id: "pkg123",
        packageName: "Pro Plan",
        amount: 1000,
        durationUnit: "yearly",
        duration: 365,
      };

      req.body = {
        packageName: "Pro Plan",
        amount: 1000,
        durationUnit: "yearly",
      };

      Package.create.mockResolvedValue(mockPackage);

      await createPackages(req, res);

      expect(Package.create).toHaveBeenCalledWith({
        packageName: "Pro Plan",
        amount: 1000,
        durationUnit: "yearly",
        duration: 365,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should create a biannual package successfully", async () => {
      const mockPackage = {
        _id: "pkg123",
        packageName: "Semi-Annual Plan",
        amount: 500,
        durationUnit: "biannually",
        duration: 180,
      };

      req.body = {
        packageName: "Semi-Annual Plan",
        amount: 500,
        durationUnit: "biannually",
      };

      Package.create.mockResolvedValue(mockPackage);

      await createPackages(req, res);

      expect(Package.create).toHaveBeenCalledWith({
        packageName: "Semi-Annual Plan",
        amount: 500,
        durationUnit: "biannually",
        duration: 180,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 for invalid durationUnit", async () => {
      req.body = {
        packageName: "Invalid Plan",
        amount: 100,
        durationUnit: "weekly",
      };

      await createPackages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid durationUnit",
      });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      req.body = {
        packageName: "Test Plan",
        amount: 100,
        durationUnit: "monthly",
      };

      Package.create.mockRejectedValue(error);

      await createPackages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Couldn't create package",
        response: error.message,
      });
    });
  });

  describe("getPackages", () => {
    it("should return all packages successfully", async () => {
      const mockPackages = [
        { _id: "1", packageName: "Basic" },
        { _id: "2", packageName: "Pro" },
      ];

      Package.find.mockResolvedValue(mockPackages);

      await getPackages(req, res);

      expect(Package.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Packages fetched Successfully",
        data: mockPackages,
      });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      Package.find.mockRejectedValue(error);

      await getPackages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching packages",
        response: error,
      });
    });
  });

  describe("getPackageById", () => {
    it("should return package by ID successfully", async () => {
      const mockPackage = { _id: "pkg123", packageName: "Basic Plan" };
      req.query.packageId = "pkg123";

      Package.findById.mockResolvedValue(mockPackage);

      await getPackageById(req, res);

      expect(Package.findById).toHaveBeenCalledWith("pkg123");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Packages fetched Successfully",
        data: mockPackage,
      });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Database error");
      req.query.packageId = "pkg123";

      Package.findById.mockRejectedValue(error);

      await getPackageById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Error fetching packages",
        response: error,
      });
    });
  });

  describe("initiatePayment", () => {
    it("should initiate payment successfully", async () => {
      const mockPackage = {
        _id: "pkg123",
        packageName: "Basic Plan",
        amount: 100,
      };
      const mockOrder = {
        id: "order_123",
        amount: 10000,
        currency: "INR",
      };

      req.query.packageId = "pkg123";
      Package.findById.mockResolvedValue(mockPackage);
      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder);

      await initiatePayment(req, res);

      expect(Package.findById).toHaveBeenCalledWith("pkg123");
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: "INR",
        receipt: `receipt_${mockPackage._id}`,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment initiation successful",
        orderId: mockOrder.id,
        razorpayKey: process.env.RAZORPAY_KEY_ID,
        amount: mockPackage.amount,
        currency: "INR",
      });
    });

    it("should return 404 when package not found", async () => {
      req.query.packageId = "pkg123";
      Package.findById.mockResolvedValue(null);

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Package not found" });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Razorpay error");
      req.query.packageId = "pkg123";

      Package.findById.mockRejectedValue(error);

      await initiatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment initiation failed",
        error: error.message,
      });
    });
  });

  describe("verifyPayment", () => {
    it("should verify payment and create subscription successfully", async () => {
      const mockUser = { _id: "user123", name: "Test User" };
      const mockPackage = {
        _id: "pkg123",
        packageName: "Basic Plan",
        duration: 30,
      };
      const mockPaymentDetails = {
        id: "pay_123",
        status: "captured",
        amount: 10000,
        currency: "INR",
      };
      const mockSubscription = {
        _id: "sub123",
        subscriberName: "Test User",
      };

      req.body = {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "valid_signature",
        userId: "user123",
        packageId: "pkg123",
      };

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("valid_signature"),
      };
      crypto.createHmac.mockReturnValue(mockHmac);

      User.findById.mockResolvedValue(mockUser);
      Package.findById.mockResolvedValue(mockPackage);
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPaymentDetails);
      Subscription.create.mockResolvedValue(mockSubscription);
      PaymentTransaction.create.mockResolvedValue({});

      await verifyPayment(req, res);

      expect(crypto.createHmac).toHaveBeenCalledWith(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment successful and subscription created",
        subscription: mockSubscription,
      });
    });

    it("should return 400 for signature mismatch", async () => {
      req.body = {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "invalid_signature",
        userId: "user123",
        packageId: "pkg123",
      };

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("valid_signature"),
      };
      crypto.createHmac.mockReturnValue(mockHmac);
      PaymentTransaction.create.mockResolvedValue({});

      await verifyPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment verification failed: Signature mismatch",
      });
    });

    it("should return 404 when user or package not found", async () => {
      req.body = {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "valid_signature",
        userId: "user123",
        packageId: "pkg123",
      };

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("valid_signature"),
      };
      crypto.createHmac.mockReturnValue(mockHmac);

      const mockPaymentDetails = {
        id: "pay_123",
        status: "captured",
        amount: 10000,
        currency: "INR",
      };

      User.findById.mockResolvedValue(null);
      Package.findById.mockResolvedValue(null);
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPaymentDetails);

      await verifyPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "User or Package not found during verification.",
      });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Verification error");
      req.body = {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "valid_signature",
        userId: "user123",
        packageId: "pkg123",
      };

      crypto.createHmac.mockImplementation(() => {
        throw error;
      });

      await verifyPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment verification failed",
        error: error.message,
      });
    });
  });

  describe("handlePaymentWebhook", () => {
    it("should handle webhook and create subscription successfully", async () => {
      const mockUser = { _id: "user123", name: "Test User" };
      const mockPackage = {
        _id: "pkg123",
        packageName: "Basic Plan",
        duration: 30,
      };
      const mockSubscription = { _id: "sub123" };

      req.body = {
        payload: {
          payment: {
            entity: {
              id: "pay_123",
              order_id: "order_123",
              status: "captured",
              amount: 10000,
              currency: "INR",
              notes: {
                userId: "user123",
                packageId: "pkg123",
              },
            },
          },
        },
      };
      req.headers = { "x-razorpay-signature": "valid_signature" };

      Razorpay.validateWebhookSignature.mockReturnValue(true);
      User.findById.mockResolvedValue(mockUser);
      Package.findById.mockResolvedValue(mockPackage);
      PaymentTransaction.create.mockResolvedValue({});
      Subscription.create.mockResolvedValue(mockSubscription);

      await handlePaymentWebhook(req, res);

      expect(Razorpay.validateWebhookSignature).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Payment successful and subscription created",
        subscription: mockSubscription,
      });
    });

    it("should return 400 for invalid webhook signature", async () => {
      req.body = { payload: {} };
      req.headers = { "x-razorpay-signature": "invalid_signature" };

      Razorpay.validateWebhookSignature.mockReturnValue(false);

      await handlePaymentWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid webhook signature",
      });
    });

    it("should return 400 for non-captured payment", async () => {
      req.body = {
        payload: {
          payment: {
            entity: {
              status: "failed",
            },
          },
        },
      };
      req.headers = { "x-razorpay-signature": "valid_signature" };

      Razorpay.validateWebhookSignature.mockReturnValue(true);

      await handlePaymentWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Payment failed" });
    });

    it("should handle errors and return 500", async () => {
      const error = new Error("Webhook error");
      req.body = { payload: {} };
      req.headers = { "x-razorpay-signature": "valid_signature" };

      Razorpay.validateWebhookSignature.mockImplementation(() => {
        throw error;
      });

      await handlePaymentWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Webhook handling failed",
        error: error.message,
      });
    });
  });

  describe("createPayPalOrder", () => {
    it("should create PayPal order successfully", async () => {
      const mockOrder = {
        id: "paypal_order_123",
        status: "CREATED",
        links: [
          { rel: "approve", href: "https://paypal.com/approve" },
          { rel: "self", href: "https://paypal.com/self" },
        ],
      };
      const mockTransaction = { _id: "trans123" };

      req.query.userId = "user123";
      req.body = {
        packageId: "pkg123",
        amount: 100,
        currency: "USD",
        packageName: "Basic Plan",
      };

      mockPayPalClient.execute.mockResolvedValue({ result: mockOrder });
      PaymentTransaction.create.mockResolvedValue(mockTransaction);

      await createPayPalOrder(req, res);

      expect(mockPayPalClient.execute).toHaveBeenCalled();
      expect(PaymentTransaction.create).toHaveBeenCalledWith({
        userId: "user123",
        packageId: "pkg123",
        packageName: "Basic Plan",
        amount: 100,
        currency: "USD",
        paymentGateway: "paypal",
        gatewayOrderId: mockOrder.id,
        status: "created",
        paypalResponse: mockOrder,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "PayPal order created successfully",
        orderId: mockOrder.id,
        approvalUrl: "https://paypal.com/approve",
      });
    });

    it("should return 400 for missing payment details", async () => {
      req.query.userId = "user123";
      req.body = {
        packageId: "pkg123",
        amount: 0,
      };

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "Missing or invalid payment details (packageId, amount, currency, packageName).",
      });
    });

    it("should handle errors when no approval URL found", async () => {
      const mockOrder = {
        id: "paypal_order_123",
        status: "CREATED",
        links: [],
      };

      req.query.userId = "user123";
      req.body = {
        packageId: "pkg123",
        amount: 100,
        currency: "USD",
        packageName: "Basic Plan",
      };

      mockPayPalClient.execute.mockResolvedValue({ result: mockOrder });

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to get PayPal approval URL.",
      });
    });

    it("should handle PayPal API errors", async () => {
      const error = {
        statusCode: 400,
        message: "PayPal error",
        response: { details: [{ issue: "INVALID_REQUEST" }] },
      };

      req.query.userId = "user123";
      req.body = {
        packageId: "pkg123",
        amount: 100,
        currency: "USD",
        packageName: "Basic Plan",
      };

      mockPayPalClient.execute.mockRejectedValue(error);

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "PayPal error",
        details: error.response.details,
      });
    });
  });

  describe("capturePayPalPayment", () => {
    it("should capture PayPal payment and create subscription successfully", async () => {
      const mockTransaction = {
        _id: "trans123",
        userId: "user123",
        packageId: "pkg123",
        status: "created",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockUser = { _id: "user123", name: "Test User" };
      const mockPackage = {
        _id: "pkg123",
        packageName: "Basic Plan",
        duration: 30,
      };
      const mockOrder = {
        id: "paypal_order_123",
        status: "COMPLETED",
        purchase_units: [
          {
            payments: {
              captures: [{ id: "capture_123" }],
            },
          },
        ],
      };

      req.query = { token: "paypal_order_123", PayerID: "payer123" };

      PaymentTransaction.findOne.mockResolvedValue(mockTransaction);
      mockPayPalClient.execute.mockResolvedValue({ result: mockOrder });
      Package.findById.mockResolvedValue(mockPackage);
      User.findById.mockResolvedValue(mockUser);
      Subscription.create.mockResolvedValue({});

      await capturePayPalPayment(req, res);

      expect(PaymentTransaction.findOne).toHaveBeenCalledWith({
        gatewayOrderId: "paypal_order_123",
        paymentGateway: "paypal",
        status: "created",
      });
      expect(mockPayPalClient.execute).toHaveBeenCalled();
      expect(mockTransaction.save).toHaveBeenCalled();
      expect(Subscription.create).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/subscription-success?status=success&orderId=paypal_order_123`
      );
    });

    it("should handle payment not completed status", async () => {
      const mockTransaction = {
        _id: "trans123",
        status: "created",
        save: jest.fn().mockResolvedValue(true),
      };
      const mockOrder = {
        id: "paypal_order_123",
        status: "PENDING",
      };

      req.query = { token: "paypal_order_123", PayerID: "payer123" };

      PaymentTransaction.findOne.mockResolvedValue(mockTransaction);
      mockPayPalClient.execute.mockResolvedValue({ result: mockOrder });

      await capturePayPalPayment(req, res);

      expect(mockTransaction.save).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/payment-failed?status=failed&orderStatus=PENDING&orderId=paypal_order_123`
      );
    });

    it("should handle errors and redirect to payment failed", async () => {
      const error = new Error("Capture error");
      req.query = { token: "paypal_order_123", PayerID: "payer123" };

      PaymentTransaction.findOne.mockRejectedValue(error);

      await capturePayPalPayment(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining("/payment-failed?status=error")
      );
    });
  });
});
