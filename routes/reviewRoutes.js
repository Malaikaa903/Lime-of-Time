const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

//public routes
router.get("/business/:businessId", reviewController.getBusinessReviews);
router.get("/service/:serviceId", reviewController.getServiceReviews);
router.get("/staff/:staffId", reviewController.getStaffReviews);

//protected routes
router.use(authController.protect);

//client routes
router.post(
  "/",
  authController.restrictTo("client"),
  reviewController.addReview,
);
router.get(
  "/my-reviews",
  authController.restrictTo("client"),
  reviewController.getMyReviews,
);
router.patch(
  "/:id",
  authController.restrictTo("client"),
  reviewController.updateReview,
);
router.delete(
  "/:id",
  authController.restrictTo("client"),
  reviewController.deleteReview,
);

module.exports = router;
