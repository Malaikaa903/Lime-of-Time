const jwt = require("jsonwebtoken");
const { promisify } = require("util");

const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { generateOTP } = require("../utils/otpGenerate");
const sendEmail = require("../utils/email");

// JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const signTempToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
};

// SIGNUP (Send OTP)
exports.signUp = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm, role } = req.body;

  if (!email || !password || !role) {
    return next(new AppError("Please provide email, password and role", 400));
  }

  const existingUser = await User.findOne({ email }).select("+password");

  const otp = generateOTP();

  let user;

  // User already exists
  if (existingUser) {
    if (existingUser.isVerified) {
      return next(new AppError("User already exists", 400));
    }

    //  If NOT verified → update existing user
    existingUser.password = password;
    existingUser.passwordConfirm = passwordConfirm;
    existingUser.role = role;
    existingUser.otp = otp;
    existingUser.otpExpires = Date.now() + 10 * 60 * 1000;

    user = await existingUser.save({ validateBeforeSave: false });
  }
  //  New user
  else {
    user = await User.create({
      email,
      password,
      passwordConfirm,
      role,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false,
    });
  }

  // CREATE TEMP TOKEN
  const tempToken = signTempToken(user._id);

  //  SEND EMAIL
  const message = `Welcome to Lime of Time!! Your OTP is ${otp}. It expires in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your Verification OTP",
      message,
    });
  } catch (err) {
    console.log("Email Error:", err);
    return next(new AppError("Failed to send OTP. Please try again.", 500));
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "OTP sent successfully",
    tempToken,
    data: {
      email: user.email,
    },
  });
});

//  VERIFY OTP
exports.verifyOTP = catchAsync(async (req, res, next) => {
  let token;

  //  Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Token missing", 401));
  }

  //  Decode token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Get user from token
  const user = await User.findById(decoded.id).select("+otp +otpExpires");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (user.isVerified) {
    return next(new AppError("User already verified", 400));
  }

  const { otp } = req.body;

  if (user.otp !== Number(otp) || user.otpExpires < Date.now()) {
    return next(new AppError("Invalid or expired OTP", 400));
  }

  //  Verify user
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    status: 200,
    message: "OTP verified successfully",
  });
});

//  LOGIN
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.isVerified) {
    return next(new AppError("Please verify your account first", 401));
  }

  const token = signToken(user._id);

  user.password = undefined;
  user.__v = undefined;

  res.status(200).json({
    success: true,
    status: 200,
    message: "User Logged In successfully.",
    token,
    data: {
      user,
    },
  });
});

//  PROTECT ROUTES
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("User no longer exists", 401));
  }

  req.user = currentUser;
  next();
});

//  ROLE-BASED ACCESS
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Permission denied", 403));
    }
    next();
  };
};
