const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  slots: {
    type: [String],
    default: [],
  },
});

const staffSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.ObjectId,
      ref: "Business",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    workPhotos: {
      type: [String],
      default: [],
    },

    availability: {
      type: [availabilitySchema],
      default: [],
    },

    assignedServices: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Service",
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;
