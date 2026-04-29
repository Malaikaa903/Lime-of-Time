const SubscriptionPlan = require("../models/subscriptionPlanModel");
const ClientSubscription = require("../models/clientSubscriptionModel");
const Business = require("../models/businessModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// create subscription plan (owner)
exports.createPlan = catchAsync(async (req, res, next) => {
  const { planName, timePeriod, amount, facilities } = req.body;

  if (!planName || !timePeriod || !amount) {
    return next(
      new AppError("Plan name, time period and amount are required", 400),
    );
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // check duplicate plan
  const existingPlan = await SubscriptionPlan.findOne({
    business: business._id,
    planName: { $regex: `^${planName}$`, $options: "i" },
    isActive: true,
  });

  if (existingPlan) {
    return next(new AppError(`A plan named "${planName}" already exists`, 400));
  }

  const plan = await SubscriptionPlan.create({
    business: business._id,
    planName,
    timePeriod,
    amount,
    facilities: facilities || "",
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Subscription plan created successfully",
    data: { plan },
  });
});

// get my plans (owner)
exports.getMyPlans = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const plans = await SubscriptionPlan.find({
    business: business._id,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    status: 200,
    results: plans.length,
    data: { plans },
  });
});

// update plan (owner)
exports.updatePlan = catchAsync(async (req, res, next) => {
  const { planName, timePeriod, amount, facilities } = req.body;

  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business || plan.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  if (planName) plan.planName = planName;
  if (timePeriod) plan.timePeriod = timePeriod;
  if (amount) plan.amount = amount;
  if (facilities) plan.facilities = facilities;

  await plan.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Plan updated successfully",
    data: { plan },
  });
});

// delete plan (owner)
exports.deletePlan = catchAsync(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  const business = await Business.findOne({ owner: req.user.id });

  if (!business || plan.business.toString() !== business._id.toString()) {
    return next(new AppError("Permission denied", 403));
  }

  // check if any client subscribe to that plan currently
  const activeSubscription = await ClientSubscription.countDocuments({
    plan: plan._id,
    status: "active",
  });

  if (activeSubscription > 0) {
    return next(
      new AppError(
        `Can't delete plan because ${activeSubscription} clients are currently subscribed to this plan.`,
        400,
      ),
    );
  }

  plan.isActive = false;
  await plan.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Plan deleted successfully",
  });
});

// get subscribers count (owner)
exports.getPlanSubscribers = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const plans = await SubscriptionPlan.find({
    business: business._id,
    isActive: true,
  });

  // for each plan get subscriber count
  const plansWithCount = await Promise.all(
    plans.map(async (plan) => {
      const subscriberCount = await ClientSubscription.countDocuments({
        plan: plan._id,
        status: "active",
      });
      return {
        ...plan.toJSON(),
        subscriberCount,
      };
    }),
  );

  res.status(200).json({
    success: true,
    status: 200,
    result: plans.length,
    data: { plans: plansWithCount },
  });
});

// get plans by business (client)
exports.getBusinessPlans = catchAsync(async (req, res, next) => {
  const { businessId } = req.params;

  const plans = await SubscriptionPlan.find({
    business: businessId,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    status: 200,
    results: plans.length,
    data: { plans },
  });
});

// subscribe to a plan (client)
exports.subscribeToPlan = catchAsync(async (req, res, next) => {
  const { planId } = req.body;

  if (!planId) {
    return next(new AppError("Plan ID is required", 400));
  }

  const plan = await SubscriptionPlan.findById(planId);

  if (!plan || !plan.isActive) {
    return next(new AppError("Plan not found", 404));
  }

  // check if already subscribed to this plan
  const existingSubscription = await ClientSubscription.findOne({
    client: req.user.id,
    plan: planId,
    status: "active",
  });

  if (existingSubscription) {
    return next(new AppError("You are already subscribed to this plan", 400));
  }

  // calculate next billing date
  const subscribedOn = new Date();
  let nextBilling = new Date(subscribedOn);

  if (plan.timePeriod === "monthly") {
    nextBilling.setMonth(nextBilling.getMonth() + 1);
  } else if (plan.timePeriod === "yearly") {
    nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  }

  const subscription = await ClientSubscription.create({
    client: req.user.id,
    business: plan.business,
    plan: planId,
    subscribedOn,
    nextBilling,
    autoRenew: true,
    status: "active",
  });

  const populatedSubscription = await ClientSubscription.findById(
    subscription._id,
  )
    .populate("plan", "planName timePeriod amount facilities")
    .populate("business", "businessName profilePhoto");

  res.status(201).json({
    success: true,
    status: 201,
    message: "Successfully subscribed!",
    data: { subscription: populatedSubscription },
  });
});

// get my subscriptions (client)
exports.getMySubscriptions = catchAsync(async (req, res, next) => {
  const subscriptions = await ClientSubscription.find({
    client: req.user.id,
    status: "active",
  })
    .populate("plan", "planName timePeriod amount facilities")
    .populate("business", "businessName profilePhoto location")
    .sort("-subscribedOn");

  res.status(200).json({
    success: true,
    status: 200,
    results: subscriptions.length,
    data: { subscriptions },
  });
});

// get single subscription detail (client)
exports.getSubscriptionDetail = catchAsync(async (req, res, next) => {
  const subscription = await ClientSubscription.findById(req.params.id)
    .populate("plan", "planName timePeriod amount facilities")
    .populate("business", "businessName profilePhoto location phone");

  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  if (subscription.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: { subscription },
  });
});

// toggle auto renew (client)
exports.toggleAutoRenew = catchAsync(async (req, res, next) => {
  const subscription = await ClientSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  if (subscription.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  subscription.autoRenew = !subscription.autoRenew;
  await subscription.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: `Auto renew ${subscription.autoRenew ? "enabled" : "disabled"}`,
    data: { autoRenew: subscription.autoRenew },
  });
});

// cancel subscription (client)
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const subscription = await ClientSubscription.findById(req.params.id);

  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
  }

  if (subscription.client.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  if (subscription.status !== "active") {
    return next(new AppError("Subscription is already cancelled", 400));
  }

  subscription.status = "cancelled";
  subscription.autoRenew = false;
  await subscription.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Subscription cancelled successfully",
    data: { subscription },
  });
});
