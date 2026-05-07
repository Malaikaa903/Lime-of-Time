// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const http = require("http");
// const { Server } = require("socket.io");

// dotenv.config({ path: "./config.env" });

// const connectDB = require("./utils/db");
// connectDB();

// const app = require("./app");

// //create http server
// const server = http.createServer(app);

// //initialize socket.io on http server
// const io = new Server(server, {
//   cors: { origin: "*", methods: ["GET", "POST"] },
//   pingTimeout: 10000,
// });

// // tracks which user currently connected
// const onlineUsers = new Map();

// // attach inlineUsers to every request
// app.use((req, res, next) => {
//   req.io = io;
//   req.onlineUsers = onlineUsers;
//   next();
// });

// // Socket.io event handlers
// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   //after connetcion user send their Id
//   socket.on("user_online", (userId) => {
//     onlineUsers.set(userId, socket.id);
//     console.log(`User ${userId} is online`);
//   });
//   // Join conversation Room
//   socket.on("join_conversation", (conversationId) => {
//     socket.join(`conversation_${conversationId}`);
//     console.log(
//       `Socket ${socket.id} joined room: conversation_${conversationId}`,
//     );
//   });

//   // Leave Conversation ROom
//   socket.on("leave_conversation", (conversationId) => {
//     socket.leave(`conversation_${conversationId}`);
//     console.log(
//       `socket ${socket.id} left room: conversation_${conversationId}`,
//     );
//   });

//   // Typing Indicator
//   // start typing
//   socket.on("typing", ({ conversationId, userId }) => {
//     socket.to(`conversation_${conversationId}`).emit("user_typing", {
//       userId,
//       conversationId,
//     });
//   });

//   //stop typing
//   socket.on("stop_typing", ({ conversationId, userId }) => {
//     socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
//       userId,
//       conversationId,
//     });
//   });

//   // disconnet
//   socket.on("disconnect", () => {
//     // remove user from onlineUsers map
//     onlineUsers.forEach((socketId, userId) => {
//       if (socketId === socket.id) {
//         onlineUsers.delete(userId);
//         console.log(`User ${userId} went offline`);
//       }
//     });
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });
// const PORT = process.env.PORT || 5000;

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log("Socket.io is ready for connection");
// });

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./utils/db");

connectDB();

// Step 1: onlineUsers pehle banao
const onlineUsers = new Map();

// Step 2: app load karo
const app = require("./app");

// Step 3: server banao
const server = http.createServer(app);

// Step 4: io banao
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 10000,
});

// Step 5: io aur onlineUsers globally set karo on app
// Ye sabse simple aur reliable tarika hai!
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  //after connection user send their Id
  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
  });

  // Join conversation Room
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(
      `Socket ${socket.id} joined room: conversation_${conversationId}`,
    );
  });

  // Leave Conversation Room
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
    socket.to(`conversation_${conversationId}`).emit("user_stop_typing", {
      userId,
      conversationId,
    });
  });

  // disconnect
  socket.on("disconnect", () => {
    // remove user from onlineUsers map
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} went offline`);
      }
    });
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.io is ready for connection");
});
