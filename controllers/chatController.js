const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const Business = require("../models/businessModel");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// create/get conversation
exports.getOrCreateConversation = catchAsync(async (req, res, next) => {
  const { businessId } = req.body;

  if (!businessId) {
    return next(new AppError("Business ID is required", 400));
  }

  const business = await Business.findById(businessId);

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  // find existing conversation or create new
  let conversation = await Conversation.findOneAndUpdate(
    {
      client: req.user.id,
      business: businessId,
    },
    {
      client: req.user.id,
      business: businessId,
    },
    {
      upsert: true,
      returnDocument: "after",
      new: true,
    },
  );

  const populated = await Conversation.findById(conversation._id)
    .populate("client", "firstName lastName profilePhoto")
    .populate("business", "businessName profilePhoto");

  res.status(200).json({
    success: true,
    status: 200,
    message: "Conversation ready",
    data: { conversation: populated },
  });
});

// get my conversations (client)
exports.getMyConversations = catchAsync(async (req, res, next) => {
  const conversations = await Conversation.find({
    client: req.user.id,
  })
    .populate("business", "businessName profilePhoto")
    .sort("-lastMessageTime");

  res.status(200).json({
    success: true,
    status: 200,
    results: conversations.length,
    data: { conversations },
  });
});

// get bsiness conversation (owner)
exports.getBusinessConversations = catchAsync(async (req, res, next) => {
  const business = await Business.findOne({ owner: req.user.id });

  if (!business) {
    return next(new AppError("Business not found", 404));
  }

  const conversations = await Conversation.find({
    business: business._id,
  })
    .populate("client", "firstName lastName profilePhoto")
    .sort("-lastMessageTime");

  res.status(200).json({
    success: true,
    status: 200,
    results: conversations.length,
    data: { conversations },
  });
});

// get messages in conversation
exports.getMessages = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  // verify user belongs to this conversation
  const business = await Business.findOne({ owner: req.user.id });
  const isClient = conversation.client.toString() === req.user.id;
  const isOwner =
    business && conversation.business.toString() === business._id.toString();

  if (!isClient && !isOwner) {
    return next(new AppError("Permission denied", 403));
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "firstName lastName profilePhoto")
    .sort("createdAt");

  // mark other person's messages as read
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user.id },
      isRead: false,
    },
    { isRead: true },
  );

  // reset unread counter for this user
  if (isClient) {
    conversation.unreadByClient = 0;
  } else {
    conversation.unreadByBusiness = 0;
  }
  await conversation.save();

  res.status(200).json({
    success: true,
    status: 200,
    results: messages.length,
    data: { messages },
  });
});

// send message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return next(new AppError("Message text is required", 400));
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  // verify user belongs to this conversation
  const business = await Business.findOne({ owner: req.user.id });
  const isClient = conversation.client.toString() === req.user.id;
  const isOwner =
    business && conversation.business.toString() === business._id.toString();

  if (!isClient && !isOwner) {
    return next(new AppError("Permission denied", 403));
  }

  const senderType = isClient ? "client" : "business";

  // save message to database
  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    senderType,
    text: text.trim(),
    isRead: false,
  });

  // update conversation with last message info
  conversation.lastMessage = text.trim();
  conversation.lastMessageTime = new Date();

  // increment unread count for the OTHER person
  if (isClient) {
    conversation.unreadByBusiness += 1;
  } else {
    conversation.unreadByClient += 1;
  }
  await conversation.save();

  // populate sender info for response
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "firstName lastName profilePhoto",
  );

  // real time chat (socket.io)
  if (req.io) {
    req.io.to(`conversation_${conversationId}`).emit("new_message", {
      message: populatedMessage,
      conversationId,
    });

    // also emit conversation update
    req.io.to(`conversation_${conversationId}`).emit("conversation_updated", {
      conversationId,
      lastMessage: text.trim(),
      lastMessageTime: new Date(),
    });
  }

  // create notification for receiver
  const recipientId = isClient ? business?.owner : conversation.client;

  if (recipientId) {
    await Notification.create({
      recipient: recipientId,
      title: "New Message",
      body: text.length > 50 ? `${text.substring(0, 50)}...` : text,
      type: "new_message",
      referenceId: conversation._id,
    });
  }

  res.status(201).json({
    success: true,
    status: 201,
    data: { message: populatedMessage },
  });
});
