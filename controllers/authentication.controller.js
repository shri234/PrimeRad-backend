const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");

// Function to generate a JWT Token
async function generateToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) {
          return reject(err);
        }
        resolve(token);
      }
    );
  });
}

// Function to verify a JWT Token
async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}

// Login to Application
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      logger.error("Identifier or password missing in login request.");
      return res
        .status(400)
        .json({ message: "Identifier and password are required." });
    }

    logger.info(`Login attempt with identifier: ${identifier}`);

    const findUser = await User.findOne({
      $or: [{ email: identifier.trim() }, { mobileNumber: identifier.trim() }],
    });

    if (!findUser) {
      logger.error(`Invalid credentials for identifier: ${identifier}`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await findUser.comparePassword(password);
    if (!isPasswordValid) {
      logger.error(`Password mismatch for identifier: ${identifier}`);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token
    const token = await generateToken({ _id: findUser._id });

    // Store JWT in httpOnly cookie
    res.cookie("jwt", token, { httpOnly: true });

    logger.info(`User ${findUser._id} successfully logged in.`);

    // Return user details & token for frontend use
    return res.status(200).json({
      message: "Successfully Logged In",
      token,
      user: {
        _id: findUser._id,
        name: findUser.name,
        email: findUser.email,
        mobileNumber: findUser.mobileNumber,
      },
    });
  } catch (error) {
    logger.error(
      `Error during login for identifier ${req.body.identifier || "unknown"}: ${
        error.message
      }`
    );
    return res.status(500).json({ message: "An error occurred during login." });
  }
}

// Register a User
async function createUser(req, res) {
  try {
    const { email, password, name, mobileNumber, designation } = req.body;

    if (
      !email?.trim() ||
      !password?.trim() ||
      !name?.trim() ||
      !mobileNumber?.trim()
    ) {
      logger.warn("Missing required fields in createUser request");
      return res
        .status(400)
        .json({
          message: "Email, password, name, and mobile number are required.",
        });
    }

    if (email.trim()) {
      const emailExists = await User.findOne({ email: req.body.email.trim() });
      if (emailExists) {
        logger.info(
          `Attempted to create user with existing email: ${email.trim()}`
        );
        return res.status(400).json({ message: "Email already exists." });
      }
    }

    if (mobileNumber.trim()) {
      const mobileNumberExists = await User.findOne({
        mobileNumber: req.body.mobileNumber.trim(),
      });
      if (mobileNumberExists) {
        logger.info(
          `Attempted to create user with existing mobile number: ${mobileNumber.trim()}`
        );
        return res
          .status(400)
          .json({ message: "Mobile number already exists." });
      }
    }

    const user = new User({
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      designation: designation?.trim(),
    });

    await user.save();
    logger.info(`User created successfully: ${user._id}`);
    res.status(200).json({ message: "Created Successfully", data: user });
  } catch (err) {
    logger.error(`Error in createUser function: ${err.message}`, {
      stack: err.stack,
    });
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

module.exports = {
  generateToken,
  verifyToken,
  login,
  createUser,
};
