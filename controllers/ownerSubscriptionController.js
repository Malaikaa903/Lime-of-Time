const OwnerSubscription = require("../models/ownerSubscriptionModel");
const Staff = require("../models/staffModel");
const Service = require("../models/serviceModel");
const Business = require("../models/businessModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// plan limits definition
const PLAN_LIMITS = {
  trial: { maxStaff: 999, maxServices: 999 },
  free: { maxStaff: 1, maxServices: 5 },
  premium: { maxStaff: 3, maxServices: 15 },
};

// helper func.
const getOwnerLimits = async (ownerId) => {
  let subscription = await OwnerSubscription.findOne({ owner: ownerId });

  if (!subscription) {
    // create free trial automatically
    subscription = await OwnerSubscription.create({ owner: ownerId });
  }

  // check if trial expired
  if (subscription.isTrialActive && new Date() > subscription.trialEndDate) {
    subscription.isTrialActive = false;
    subscription.status = "expired";
    await subscription.save();
  }

  // determine which limits to apply
  if (subscription.isTrialActive) {
    return { limits: PLAN_LIMITS.trial, subscription };
  } else if (
    subscription.plan === "premium" &&
    subscription.status === "active"
  ) {
    return { limits: PLAN_LIMITS.premium, subscription };
  } else {
    return { limits: PLAN_LIMITS.free, subscription };
  }
};

// export helper for use in other controllers
exports.getOwnerLimits = getOwnerLimits;

// get my subscription (owner)
exports.getMySubscription = catchAsync(async (req, res, next) => {
  const { limits, subscription } = await getOwnerLimits(req.user.id);

  const business = await Business.findOne({ owner: req.user.id });

  // get current usage
  let currentStaff = 0;
  let currentServices = 0;

  if (business) {
    currentStaff = await Staff.countDocuments({
      business: business._id,
      isActive: true,
    });
    currentServices = await Service.countDocuments({
      business: business._id,
      isActive: true,
    });
  }

  // days remaining in trial
  const daysRemaining = subscription.isTrialActive
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndDate - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  res.status(200).json({
    success: true,
    status: 200,
    data: {
      subscription,
      daysRemaining,
      currentUsage: {
        staff: currentStaff,
        services: currentServices,
      },
      limits,
      // plan comparison for upgrade screen
      plans: {
        free: {
          name: "Free Plan",
          description: "14 Days Free Trial for all new business accounts",
          price: 0,
          limits: PLAN_LIMITS.free,
        },
        premium: {
          name: "Premium Plan",
          price: 16.99,
          period: "month",
          features: [
            "1 Location",
            "Up to 3 Staff",
            "Max 15 Services",
            "Booking Management",
            "Enhanced profile visibility",
          ],
          limits: PLAN_LIMITS.premium,
        },
      },
    },
  });
});

// upgrade to premium
exports.upgradeToPremium = catchAsync(async (req, res, next) => {
  let subscription = await OwnerSubscription.findOne({
    owner: req.user.id,
  });

  if (!subscription) {
    subscription = new OwnerSubscription({ owner: req.user.id });
  }

  // already premium
  if (subscription.plan === "premium" && subscription.status === "active") {
    return next(new AppError("You are already on Premium plan!", 400));
  }

  // mock payment success
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  subscription.plan = "premium";
  subscription.status = "active";
  subscription.isTrialActive = false;
  subscription.billingDate = nextBilling;
  subscription.amount = 16.99;

  await subscription.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Successfully upgraded to Premium Plan! 🎉",
    data: {
      subscription,
      nextBilling,
      limits: PLAN_LIMITS.premium,
    },
  });
});

// cancel subscription
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const subscription = await OwnerSubscription.findOne({
    owner: req.user.id,
  });

  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  if (subscription.status === "cancelled") {
    return next(new AppError("Subscription already cancelled", 400));
  }

  subscription.status = "cancelled";
  await subscription.save();

  res.status(200).json({
    success: true,
    status: 200,
    message:
      "Subscription cancelled. You can still use features until billing date.",
    data: { subscription },
  });
});
