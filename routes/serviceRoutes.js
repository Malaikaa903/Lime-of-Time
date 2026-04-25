const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const authController = require("../controllers/authController");
const { uploadServiceImages } = require("../utils/upload");

// public routes
router.get("/business/:businessId", serviceController.getServicesByBusiness);
router.get("/:id", serviceController.getServiceById);
router.get("/:id/available-slots", serviceController.getAvailableSlots);

router.use(authController.protect);
// owner only routes
router.use(authController.restrictTo("business_owner"));

router.post("/", uploadServiceImages, serviceController.createService);
router.get("/", serviceController.getMyServices);
router.patch("/:id", uploadServiceImages, serviceController.updateService);
router.post("/:id/addons", serviceController.addAddOns);
router.delete("/:id/addons/:addOnId", serviceController.removeAddOn);
router.post("/:id/discount", serviceController.addDiscount);
router.delete("/:id/discount", serviceController.removeDiscount);
router.delete("/:id", serviceController.removeService);

module.exports = router;
