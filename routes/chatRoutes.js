const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");
const authController = require("../controllers/authController");

router.use(authController.protect);

router.post("/conversations", chatController.getOrCreateConversation);

// client inbox
router.get(
  "/conversations/my",
  authController.restrictTo("client"),
  chatController.getMyConversations,
);

// owner inbox
router.get(
  "/conversations/business",
  authController.restrictTo("business_owner"),
  chatController.getBusinessConversations,
);

// messages
router.get(
  "/conversations/:conversationId/messages",
  chatController.getMessages,
);

router.post(
  "/conversations/:conversationId/messages",
  chatController.sendMessage,
);

module.exports = router;
