const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: String,
      enum: ["admin", "business"],
      default: "admin",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", categorySchema);
