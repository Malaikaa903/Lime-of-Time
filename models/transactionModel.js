const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
      required: true,
    },

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

    subtotal: Number,
    salesTax: Number,
    vat: Number,
    totalAmount: Number,

    paymentMethod: {
      type: String,
      enum: ["google_pay", "apple_pay", "paypal", "credit_card", "cash"],
    },

    status: {
      type: String,
      enum: ["success", "failed", "refunded"],
      default: "success",
    },
    receiptData: {
      businessName: String,
      businessAddress: String,
      businessPhone: String,
      serviceName: String,
      bookingDate: Date,
      bookingTime: String,
    },
  },
  { timestamps: true },
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
