const express = require("express");
const router = express.Router();
const upload = require("../config/uploadImage");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getReviewsByItemId,
  getUserReviewForItem,
  createReview,
  updateReview,
  deleteReview,
  //   updateSession,
} = require("../controllers/reviews.controller");

router.post(
  "/create",
  //  authMiddleware,
  createReview
);
router.get(
  "/get",
  // authMiddleware,
  getUserReviewForItem
);
router.get(
  "/getReviewsForItem",
  // authMiddleware,
  getReviewsByItemId
);
// router.get("/getImage", getSubCategoryImages);

module.exports = router;
