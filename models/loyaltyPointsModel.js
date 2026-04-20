const mongoose = require("mongoose");

const loyaltyPointsSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },

    business: {
      type: mongoose.Schema.ObjectId,
      ref: "Business",
      required: true,
    },

    points: {
      type: Number,
      default: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

loyaltyPointsSchema.index({ client: 1, business: 1 }, { unique: true });

module.exports = mongoose.model("LoyaltyPoints", loyaltyPointsSchema);
