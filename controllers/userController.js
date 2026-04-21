const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// Complete User Profile
exports.completeProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, address } = req.body;

  // find logged in user
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  //update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (address) {
    user.location = {
      type: "Point",
      address: address,
    };
  }
  if (req.file) {
    user.profilePhoto = req.file.filename;
  }

  user.profileCompleted = true;

  await user.save({ validateBeforeSave: false });

  user.password = undefined;
  user.__v = undefined;

  res.status(200).json({
    success: true,
    status: 200,
    message: "Profile completed successfully",
    data: { user },
  });
});

// Get User profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.status(200).json({
    success: true,
    status: 200,
    data: { user },
  });
});

// Update Profile
exports.updateMe = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, address } = req.body;

  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (address) updateData["location.address"] = address;
  if (req.file) {
    updateData.profilePhoto = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Profile Updated Successfully",
    data: { user },
  });
});

// Delete (deactivate) account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Account deleted successfully",
  });
});

// Notifications toggle
exports.toggleNotifications = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  user.notificationsEnabled = !user.notificationsEnabled;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `Notifications ${user.notificationsEnabled ? "enabled" : "disabled"}`,
    data: {
      notificationsEnabled: user.notificationsEnabled,
    },
  });
});
