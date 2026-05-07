const express = require("express");
const router = express.Router();

const feedbackController = require("../controllers/feedbackController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.post("/", feedbackController.submitFeedback);

module.exports = router;
