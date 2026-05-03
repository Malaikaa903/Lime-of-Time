const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config({ path: "./config.env" });

const app = require("./app");
const connectDB = require("./utils/db");

connectDB();

//create http server
const server = http.createServer(app);

//initialize socket.io on http server
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 10000,
});

// attach io instance to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join conversation Room
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(
      `Socket ${socket.id} joined room: conversation_${conversationId}`,
    );
  });

  // Leave Conversation ROom
  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(
      `socket ${socket.id} left room: conversation_${conversationId}`,
    );
  });

  // Typing Indicator
  // start typing
  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(`conversation_${conversationId}`).emit("user_typing", {
      userId,
      conversationId,
    });
  });

  //stop typing
  socket.on("stop_typing", ({ conversationId, userId }) => {
    socket.to(`coversation_${conversationId}`).emit("user_stop_typing", {
      userId,
      conversationId,
    });
  });

  // disconnet
  socket.on("disconnet", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.io is ready for connection");
});
