const mongoose = require("mongoose");

const workingHoursSchema = new mongoose.Schema({
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
  isOpen: {
    type: Boolean,
    default: false,
  },
  openTime: {
    type: String,
    default: null,
  },
  closeTime: {
    type: String,
    default: null,
  },
});

const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    phone: String,
    email: String,
    website: String,

    profilePhoto: {
      type: String,
      default: null,
    },

    coverPhotos: {
      type: [String],
      default: [],
    },

    location: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        type: String,
        default: "",
      },
    },

    workingHours: {
      type: [workingHoursSchema],
      default: [],
    },

    paymentAccount: {
      bankName: {
        type: String,
        default: null,
      },
      accountTitle: {
        type: String,
        default: null,
      },
      accountNumber: {
        type: String,
        default: null,
      },
      iban: {
        type: String,
        default: null,
      },
      branchName: {
        type: String,
        default: null,
      },
      acceptsFullPayment: {
        type: Boolean,
        default: true,
      },
      acceptsPartialPayment: {
        type: Boolean,
        default: false,
      },
      acceptsCash: {
        type: Boolean,
        default: false,
      },
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    setupStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 6,
    },

    setupComplete: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
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

businessSchema.index({ location: "2dsphere" });

businessSchema.index({ businessName: "text", description: "text" });

const Business = mongoose.model("Business", businessSchema);
module.exports = Business;
