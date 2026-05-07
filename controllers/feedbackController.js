const Feedback = require("../models/feedbackModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// submit feedback
exports.submitFeedback = catchAsync(async (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return next(new AppError("Please provide feedback message", 400));
  }

  const feedback = await Feedback.create({
    user: req.user.id,
    message: message.trim(),
    role: req.user.role,
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Feedback submitted successfully! Thank you.",
    data: { feedback },
  });
});
