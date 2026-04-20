const mongoose = require("mongoose");

const addOnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
});

const discountSchema = new mongoose.Schema({
  percentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

const serviceSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.ObjectId,
      ref: "Business",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: [true, "Service category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },

    breakTime: {
      type: Number,
      default: 0,
    },

    serviceImages: {
      type: [String],
      default: [],
    },

    coverImage: {
      type: String,
      default: null,
    },

    categoryCoverImage: {
      type: String,
      default: null,
    },

    addOns: {
      type: [addOnSchema],
      default: [],
    },

    discount: {
      type: discountSchema,
      default: null,
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

serviceSchema.index({ name: "text", description: "text" });

serviceSchema.virtual("finalPrice").get(function () {
  if (
    this.discount &&
    this.discount.isActive &&
    new Date() >= this.discount.startDate &&
    new Date() <= this.discount.endDate
  ) {
    const discountAmount = (this.price * this.discount.percentage) / 100;
    return Math.round((this.price - discountAmount) * 100) / 100;
  }
  return this.price;
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
