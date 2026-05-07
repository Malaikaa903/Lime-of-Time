const express = require("express");
const router = express.Router();

const ownerSubController = require("../controllers/ownerSubscriptionController");
const authController = require("../controllers/authController");

router.use(authController.protect);
router.use(authController.restrictTo("business_owner"));

router.get("/my-plan", ownerSubController.getMySubscription);
router.post("/upgrade", ownerSubController.upgradeToPremium);
router.patch("/cancel", ownerSubController.cancelSubscription);

module.exports = router;
