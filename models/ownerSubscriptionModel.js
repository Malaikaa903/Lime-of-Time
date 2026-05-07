const mongoose = require("mongoose");

const ownerSubscriptionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    // 14 days free trial
    trialStartDate: {
      type: Date,
      default: Date.now,
    },
    trialEndDate: {
      type: Date,
    },
    isTrialActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled"],
      default: "trial",
    },
    billingDate: {
      type: Date,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// auto set trial end date (14 days)
ownerSubscriptionSchema.pre("save", function () {
  if (this.isNew) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    this.trialEndDate = trialEnd;
  }
});

module.exports = mongoose.model("OwnerSubscription", ownerSubscriptionSchema);
