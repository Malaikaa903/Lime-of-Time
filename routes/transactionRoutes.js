const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transactionController");
const authController = require("../controllers/authController");

router.use(authController.protect);

// client routes
router.get(
  "/my-transactions",
  authController.restrictTo("client"),
  transactionController.getMyTransactions,
);

// shared route (client + owner)
router.get("/:id", transactionController.getTransactionById);

// owner routes
router.get(
  "/owner/history",
  authController.restrictTo("business_owner"),
  transactionController.getBusinessTransactions,
);

module.exports = router;
