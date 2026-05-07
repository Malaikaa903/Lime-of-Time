const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: [true, "Please provide feedback message"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["client", "business_owner"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
