const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.get("/", notificationController.getMyNotifications);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.delete("/delete-all", notificationController.deleteAllNotifications);

router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
