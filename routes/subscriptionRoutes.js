const express = require("express");
const router = express.Router();

const subscriptionController = require("../controllers/subscriptionController");
const authController = require("../controllers/authController");

// public route
router.get(
  "/plans/business/:businessId",
  subscriptionController.getBusinessPlans,
);

router.use(authController.protect);

router.post(
  "/subscribe",
  authController.restrictTo("client"),
  subscriptionController.subscribeToPlan,
);

router.get(
  "/my-subscriptions",
  authController.restrictTo("client"),
  subscriptionController.getMySubscriptions,
);

router.get(
  "/my-subscriptions/:id",
  authController.restrictTo("client"),
  subscriptionController.getSubscriptionDetail,
);

router.patch(
  "/my-subscriptions/:id/toggle-auto-renew",
  authController.restrictTo("client"),
  subscriptionController.toggleAutoRenew,
);

router.patch(
  "/my-subscriptions/:id/cancel",
  authController.restrictTo("client"),
  subscriptionController.cancelSubscription,
);

router.post(
  "/plans",
  authController.restrictTo("business_owner"),
  subscriptionController.createPlan,
);

router.get(
  "/plans",
  authController.restrictTo("business_owner"),
  subscriptionController.getMyPlans,
);

router.get(
  "/plans/subscribers",
  authController.restrictTo("business_owner"),
  subscriptionController.getPlanSubscribers,
);

router.patch(
  "/plans/:id",
  authController.restrictTo("business_owner"),
  subscriptionController.updatePlan,
);

router.delete(
  "/plans/:id",
  authController.restrictTo("business_owner"),
  subscriptionController.deletePlan,
);

module.exports = router;
