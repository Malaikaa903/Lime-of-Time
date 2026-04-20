const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "booking_confirmed",
        "booking_cancelled",
        "booking_completed",
        "new_booking",
        "new_message",
        "reminder",
        "payment",
        "review",
      ],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.ObjectId,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
