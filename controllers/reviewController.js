const Review = require("../models/reviewModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Appointment = require("../models/appointmentModel");

//add review
exports.addReview = catchAsync(async (req, res, next) => {
  const { appointmentId, rating, comment } = req.body;

  if (!rating || !appointmentId) {
    return next(new AppError("AppointmentId and ratings are required.", 400));
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    client: req.user.id,
  });

  if (!appointment) {
    return next(new AppError("Appointment not found.", 400));
  }

  if (appointment.status !== "completed") {
    return next(
      new AppError(
        "You can give review after completion of an appointmnet",
        400,
      ),
    );
  }

  //prevent duplicate reviews
  if (appointment.isReviewed) {
    return next(
      new AppError("You already give review to this appointment", 400),
    );
  }

  const review = await Review.create({
    client: req.user.id,
    business: appointment.business,
    service: appointment.service,
    appointment: appointmentId,
    staff: appointment.staff || null,
    rating,
    comment: comment || "",
  });

  appointment.isReviewed = true;
  await appointment.save();

  const populatedReview = await Review.findById(review._id).populate(
    "client",
    "firstName lastName profilePhoto",
  );

  res.status(201).json({
    success: true,
    status: 201,
    message: "Review added successfully",
    data: {
      review: populatedReview,
    },
  });
});

// update review (client)
exports.updateReview = catchAsync(async (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating && !comment) {
    return next(
      new AppError("Please provide rating or comment to update", 400),
    );
  }

  if (rating && (rating < 1 || rating > 5)) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  if (rating) review.rating = rating;
  if (comment) review.comment = comment;

  await review.save();

  await Review.calcAverageRating(review.business);

  // recalculate business rating after update
  const updatedReview = await Review.findById(review._id).populate(
    "client",
    "firstName lastName profilePhoto",
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Review updated successfully",
    data: { review: updatedReview },
  });
});

// delete review (client)
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  const businessId = review.business;
  const appointmentId = review.appointment;

  await Review.findByIdAndDelete(req.params.id);

  await Appointment.findByIdAndUpdate(appointmentId, {
    isReviewed: false,
  });

  // recalculate business rating after deletion
  await Review.calcAverageRating(businessId);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Review deleted successfully",
  });
});

//get reviews for a business (public)
exports.getBusinessReviews = catchAsync(async (req, res, next) => {
  const { businessId } = req.params;
  const reviews = await Review.find({ business: businessId })
    .populate("client", "firstName lastName profilePhoto")
    .populate("service", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: reviews.length,
    data: { reviews },
  });
});

//get reviews for service (public)
exports.getServiceReviews = catchAsync(async (req, res, next) => {
  const { serviceId } = req.params;

  const reviews = await Review.find({ service: serviceId })
    .populate("client", "firstName lastName profilePhoto")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: reviews.length,
    data: { reviews },
  });
});

//get reviews for staff member (public)
exports.getStaffReviews = catchAsync(async (req, res, next) => {
  const { staffId } = req.params;

  const reviews = await Review.find({
    staff: staffId,
    comment: { $ne: "" },
  })
    .populate("client", "firstName lastName profilePhoto")
    .populate("service", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: reviews.length,
    data: { reviews },
  });
});

//get my reviews (client)
exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ client: req.user.id })
    .populate("business", "businessName profilePhoto")
    .populate("service", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    status: 200,
    results: reviews.length,
    data: { reviews },
  });
});
