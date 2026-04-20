const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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

    appointment: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },

    staff: {
      type: mongoose.Schema.ObjectId,
      ref: "Staff",
      default: null,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

reviewSchema.statics.calcAverageRating = async function (businessId) {
  const stats = await this.aggregate([
    { $match: { business: businessId } },
    {
      $group: {
        _id: "$business",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Business").findByIdAndUpdate(businessId, {
      rating: stats[0].avgRating,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await mongoose.model("Business").findByIdAndUpdate(businessId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.business);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
