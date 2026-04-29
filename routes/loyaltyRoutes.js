const express = require("express");
const router = express.Router();

const loyaltyController = require("../controllers/loyaltyController");
const authController = require("../controllers/authController");

router.use(authController.protect);

//owner routes
router.post(
  "/configure",
  authController.restrictTo("business_owner"),
  loyaltyController.configureLoyaltyProgram,
);

router.get(
  "/my-programs",
  authController.restrictTo("business_owner"),
  loyaltyController.getMyLoyaltyPrograms,
);

router.patch(
  "/toggle/:id",
  authController.restrictTo("business_owner"),
  loyaltyController.toggleLoyaltyProgram,
);

// client routes
router.get(
  "/my-points",
  authController.restrictTo("client"),
  loyaltyController.getMyLoyaltyPoints,
);

router.post(
  "/claim",
  authController.restrictTo("client"),
  loyaltyController.claimReward,
);

module.exports = router;
