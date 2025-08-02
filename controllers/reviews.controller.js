const Review = require("../models/reviews.model");
const Session = require("../models/dicomcase.model");

exports.getReviewsByItemId = async (req, res) => {
  try {
    const itemId = req.query.itemId;
    const reviews = await Review.find({ itemId })
      .populate("userId") // Get user info
      .sort({ createdAt: -1 })
      .limit(4); // Newest first
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserReviewForItem = async (req, res) => {
  try {
    const itemId = req.query.itemId;
    const userId = req.query.userId; // From authenticated user
    const review = await Review.find({ itemId, userId });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { itemId, rating, comment } = req.body;
    const userId = req.query.userId;

    const existingReview = await Review.findOne({ itemId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this item.",
      });
    }

    const newReview = await Review.create({ itemId, userId, rating, comment });

    // --- Update average rating on the Session/Item model (IMPORTANT) ---
    // await updateAverageRating(itemId); // Call helper function

    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    let review = await Review.findById(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    // Ensure user is the owner of the review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this review.",
      });
    }

    review.rating = rating;
    review.comment = comment;
    review.updatedAt = Date.now();
    await review.save();

    // --- Update average rating on the Session/Item model (IMPORTANT) ---
    await updateAverageRating(review.itemId); // Call helper function

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete a Review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    // Ensure user is the owner of the review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this review.",
      });
    }

    await review.deleteOne(); // Use deleteOne() or remove() depending on Mongoose version

    // --- Update average rating on the Session/Item model (IMPORTANT) ---
    await updateAverageRating(review.itemId); // Call helper function

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to update average rating on the associated item
async function updateAverageRating(itemId) {
  const stats = await Review.aggregate([
    { $match: { itemId: itemId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
  const numOfReviews = stats.length > 0 ? stats[0].numOfReviews : 0;

  await Session.findByIdAndUpdate(
    itemId,
    {
      averageRating,
      numOfReviews,
    },
    { new: true, runValidators: true }
  );
}
