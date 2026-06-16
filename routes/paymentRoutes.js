const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.post(
  "/create-payment-intent",

  paymentController.createPaymentIntent,
);
router.post("/confirm-payment", paymentController.confirmPayment);
router.post("/refund-payment", paymentController.refundPayment);
router.get(
  "/payment-status/:paymentIntentId",
  paymentController.getPaymentStatus,
);

module.exports = router;
