const Notification = require("../models/notificationModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// get my notifications
exports.getMyNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({
    recipient: req.user.id,
  }).sort("-createdAt");

  // count unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // group notifications by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = {
    today: [],
    yesterday: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.createdAt);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      grouped.today.push(notification);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(notification);
    } else {
      grouped.older.push(notification);
    }
  });

  res.status(200).json({
    success: true,
    status: 200,
    unreadCount,
    results: notifications.length,
    data: { grouped },
  });
});

// mark single notification as read (when user clicks on the notific.)
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  if (notification.isRead) {
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Notification already read",
    });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    status: 200,
    message: "Notification marked as read",
  });
});

// mark all notifications as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await Notification.updateMany(
    {
      recipient: req.user.id,
      isRead: false,
    },
    { isRead: true },
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: `${result.modifiedCount} notifications marked as read`,
    data: {
      markedCount: result.modifiedCount,
    },
  });
});

// delete single notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  if (notification.recipient.toString() !== req.user.id) {
    return next(new AppError("Permission denied", 403));
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Notification deleted",
  });
});

// delete all notifications
exports.deleteAllNotifications = catchAsync(async (req, res, next) => {
  const result = await Notification.deleteMany({
    recipient: req.user.id,
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: `${result.deletedCount} notifications deleted`,
  });
});
