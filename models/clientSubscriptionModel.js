const mongoose = require("mongoose");

const clientSubscriptionSchema = new mongoose.Schema(
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

    plan: {
      type: mongoose.Schema.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    subscribedOn: {
      type: Date,
      default: Date.now,
    },

    nextBilling: {
      type: Date,
      required: true,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ClientSubscription", clientSubscriptionSchema);
