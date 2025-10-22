const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const User = require("../models/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    console.log("inside authMiddleware", req.headers);
    let token = req.cookies?.jwt;
    if (!token && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      logger.error("Access token is missing.");
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findById(decoded._id);

    if (!user) {
      logger.error("Invalid token. User not found.");
      return res.status(401).json({ message: "Invalid token." });
    }

    req.user = user;
    logger.info(`User ${user._id} authorized successfully.`);
    next();
  } catch (err) {
    logger.error(`Error during token verification: ${err.message}`);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
