const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const globalErrorHandler = require("./utils/globalErrorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Lime of Time API is running...",
  });
});

// ROUTES

// app.use("/api/businesses", businessRoutes);
// app.use("/api/staff", staffRoutes);
// app.use("/api/services", serviceRoutes);
// app.use("/api/appointments", appointmentRoutes);
// app.use("/api/reviews", reviewRoutes);
// app.use("/api/transactions", transactionRoutes);
// app.use("/api/subscriptions", subscriptionRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/notifications", notificationRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.all("/{*path}", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});
app.use(globalErrorHandler);

module.exports = app;
