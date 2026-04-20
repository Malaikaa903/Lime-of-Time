const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.ObjectId,
      ref: "Business",
      required: true,
    },

    planName: {
      type: String,
      required: true,
    },

    timePeriod: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    facilities: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
