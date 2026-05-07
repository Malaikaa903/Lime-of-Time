const express = require("express");
const cors = require("cors");
const path = require("path");
const globalErrorHandler = require("./utils/globalErrorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const staffRoutes = require("./routes/staffRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const ownerSubscriptionRoutes = require("./routes/ownerSubscriptionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

// io middleware
// app.set() se io get karo → works after server.js sets it!
app.use((req, res, next) => {
  req.io = req.app.get("io");
  req.onlineUsers = req.app.get("onlineUsers");
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Lime of Time API is running...",
  });
});

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/owner-subscription", ownerSubscriptionRoutes);
app.use("/api/feedback", feedbackRoutes);

app.all("/{*path}", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(globalErrorHandler);

module.exports = app;
