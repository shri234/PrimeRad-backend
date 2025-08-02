const mongoose = require("mongoose");

const userSessionViewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    viewCount: { type: Number, default: 1 },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSessionViewSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("UserSessionView", userSessionViewSchema);
