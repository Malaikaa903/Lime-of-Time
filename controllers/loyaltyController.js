const LoyaltyProgram = require("../models/loyaltyProgramModel");
const LoyaltyPoints = require("../models/loyaltyPointsModel");
const Business = require("../models/businessModel");
const Service = require("../models/serviceModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// configure loyalty program (owner)
exports.configureLoyaltyProgram = catchAsync(async (req, res, next) => {
  const {
    serviceId,
    pointsPerBooking,
    pointsToRedeem,
    rewardPercent,
    expiryDate,
  } = req.body;

  if (!serviceId || !pointsPerBooking || !pointsToRedeem || !rewardPercent) {
    return next(new AppError("All fields are required", 400));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const service = await Service.findOne({
    _id: serviceId,
    business: business._id,
    isActive: true,
  });

  if (!service) {
    return next(new AppError("Service not found in your business", 404));
  }

  const program = await LoyaltyProgram.findOneAndUpdate(
    {
      business: business._id,
      service: serviceId,
    },
    {
      business: business._id,
      service: serviceId,
      pointsPerBooking: Number(pointsPerBooking),
      pointsToRedeem: Number(pointsToRedeem),
      rewardPercent: Number(rewardPercent),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: true,
    },
    {
      upsert: true,
      returnDocument: "after",
      new: true,
    },
  );

  const populated = await LoyaltyProgram.findById(program._id).populate(
    "service",
    "name price duration",
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Loyalty program configured successfully",
    data: { program: populated },
  });
});

// toggle loyalty program (owner)
exports.toggleLoyaltyProgram = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const program = await LoyaltyProgram.findById(req.params.id);

  if (!program) {
    return next(new AppError("Loyalty program not found", 404));
  }

  if (program.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  program.isActive = !program.isActive;
  await program.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: `Loyalty program ${program.isActive ? "enabled " : "disabled "}`,
    data: { isActive: program.isActive },
  });
});

// get my loyalty programs (owner)
exports.getMyLoyaltyPrograms = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const programs = await LoyaltyProgram.find({
    business: business._id,
  }).populate("service", "name price duration category");

  res.status(200).json({
    success: true,
    status: 200,
    results: programs.length,
    data: { programs },
  });
});

// get my loyalty points (client)
exports.getMyLoyaltyPoints = catchAsync(async (req, res, next) => {
  const loyaltyPoints = await LoyaltyPoints.find({
    client: req.user.id,
  }).populate("business", "businessName profilePhoto location");

  // check if client can claim loyalty progrma
  const enrichedPoints = await Promise.all(
    loyaltyPoints.map(async (lp) => {
      const program = await LoyaltyProgram.findOne({
        business: lp.business._id,
        isActive: true,
      });

      return {
        ...lp.toJSON(),
        canClaim: program ? lp.points >= program.pointsToRedeem : false,
        pointsToRedeem: program?.pointsToRedeem || 0,
        rewardPercent: program?.rewardPercent || 0,
      };
    }),
  );

  res.status(200).json({
    success: true,
    status: 200,
    results: enrichedPoints.length,
    data: { loyaltyPoints: enrichedPoints },
  });
});

// claim loyalty reward (client)
exports.claimReward = catchAsync(async (req, res, next) => {
  const { businessId } = req.body;

  if (!businessId) {
    return next(new AppError("Business ID is required", 400));
  }

  const loyaltyPoints = await LoyaltyPoints.findOne({
    client: req.user.id,
    business: businessId,
  });

  if (!loyaltyPoints || loyaltyPoints.points === 0) {
    return next(
      new AppError("You have no loyalty points for this business", 404),
    );
  }

  const program = await LoyaltyProgram.findOne({
    business: businessId,
    isActive: true,
  });

  if (!program) {
    return next(
      new AppError("No active loyalty program for this business", 404),
    );
  }

  // check if enough points to redeem
  if (loyaltyPoints.points < program.pointsToRedeem) {
    return next(
      new AppError(
        `Not enough points! You have ${loyaltyPoints.points} points. Need ${program.pointsToRedeem} to redeem.`,
        400,
      ),
    );
  }

  // check points expiry
  if (program.expiryDate && new Date() > new Date(program.expiryDate)) {
    return next(new AppError("Your loyalty points have expired", 400));
  }

  // deduct redeemed points
  loyaltyPoints.points -= program.pointsToRedeem;
  await loyaltyPoints.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: `Reward claimed! You get ${program.rewardPercent}% discount on your next booking at this business!`,
    data: {
      rewardPercent: program.rewardPercent,
      pointsUsed: program.pointsToRedeem,
      remainingPoints: loyaltyPoints.points,
    },
  });
});
