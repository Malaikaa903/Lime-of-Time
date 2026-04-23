const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { uploadUserPhoto } = require("../utils/upload");

router.use(authController.protect);

router.post(
  "/complete-profile",
  uploadUserPhoto,
  userController.completeProfile,
);

router.get("/me", userController.getMe);
router.patch("/update-me", uploadUserPhoto, userController.updateMe);
router.patch("/toggle-notifications", userController.toggleNotifications);

module.exports = router;
