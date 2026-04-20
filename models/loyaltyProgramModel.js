const mongoose = require("mongoose");

const loyaltyProgramSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.ObjectId,
      ref: "Business",
      required: true,
    },

    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
      required: true,
    },

    pointsPerBooking: {
      type: Number,
      required: true,
    },

    pointsToRedeem: {
      type: Number,
      required: true,
    },

    rewardPercent: {
      type: Number,
      required: true,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LoyaltyProgram", loyaltyProgramSchema);
