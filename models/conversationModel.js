const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
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

    lastMessage: {
      type: String,
      default: "",
    },

    lastMessageTime: {
      type: Date,
      default: Date.now,
    },

    unreadByClient: {
      type: Number,
      default: 0,
    },

    unreadByBusiness: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

conversationSchema.index({ client: 1, business: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
