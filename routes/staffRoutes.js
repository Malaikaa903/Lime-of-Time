const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const authController = require("../controllers/authController");
const { uploadStaffPhotos } = require("../utils/upload");

// public routes
router.get("/business/:businessId", staffController.getBusinessStaff);
router.get("/:id", staffController.getStaffById);

// protected routes
router.use(authController.protect);
// owner only routes
router.use(authController.restrictTo("business_owner"));

router.post("/", uploadStaffPhotos, staffController.addStaff);
router.get("/", staffController.getMyStaff);
router.patch("/:id", uploadStaffPhotos, staffController.updateStaff);
router.patch("/:id/availability", staffController.updateAvailability);
router.patch("/:id/assign-services", staffController.assignServices);
router.delete("/:id", staffController.removeStaff);
router.get("/:id/schedule", staffController.getStaffSchedule);

module.exports = router;
