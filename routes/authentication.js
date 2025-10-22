const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("../config/swaggerConfig");

const {
  login,
  createUser,
  refreshToken,
  logout,
} = require("../controllers/authentication.controller");

router.post("/login", login);
router.post("/register", createUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;
