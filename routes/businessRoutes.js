const express = require("express");
const router = express.Router();

const businessController = require("../controllers/businessController");
const authController = require("../controllers/authController");
const {
  uploadBusinessPhoto,
  uploadBusinessCovers,
} = require("../utils/upload");

// Client side (explore screen)
router.get("/", businessController.getAllBusinesses);
router.get("/home", businessController.getHomeData);
router.get("/nearby", businessController.getNearbyBusinesses);
router.get("/:id", businessController.getBusinessById);
router.get("/:id/reviews", businessController.getBusinessReviews);

router.use(authController.protect);

router.use(authController.restrictTo("business_owner"));

// profile creation
router.post(
  "/setup",
  uploadBusinessPhoto,
  businessController.createBusinessProfile,
);

// Business management
router.get("/owner/my-business", businessController.getMyBusiness);
router.patch(
  "/owner/update",
  uploadBusinessPhoto,
  businessController.updateMyBusiness,
);

router.patch("/owner/toggle-status", businessController.toggleBusinessStatus);

// Owner Dashboard
router.get("/owner/dashboard", businessController.getOwnerDashboardStats);
router.get("/owner/statistics", businessController.getBusinessStatistics);

module.exports = router;
