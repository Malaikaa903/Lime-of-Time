const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/signup", authController.signUp);
router.post("/verify-otp", authController.verifyOTP);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

router.use(authController.protect);

router.post("/logout", authController.logout);
router.patch("/update-password", authController.updatePassword);
router.post("/delete-account/request", authController.requestDeleteAccount);
router.post("/delete-account/confirm", authController.confirmDeleteAccount);

module.exports = router;
