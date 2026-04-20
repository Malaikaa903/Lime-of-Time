const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
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

    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
      required: true,
    },

    staff: {
      type: mongoose.Schema.ObjectId,
      ref: "Staff",
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
    specialNote: {
      type: String,
      default: "",
    },

    selectedAddOns: [
      {
        name: String,
        price: Number,
        description: String,
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    salesTax: {
      type: Number,
      default: 0,
    },

    vat: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["google_pay", "apple_pay", "paypal", "credit_card", "cash"],
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    cancelReason: {
      type: String,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["client", "business"],
      default: null,
    },

    isReviewed: {
      type: Boolean,
      default: false,
    },

    isManualBooking: {
      type: Boolean,
      default: false,
    },

    manualClientName: {
      type: String,
      default: null,
    },

    manualClientPhone: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
