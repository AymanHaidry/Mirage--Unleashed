const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = {}; // { username: socket.id }

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // user registers
  socket.on("registerSocket", (username) => {
    users[username] = socket.id;
    console.log(`${username} registered with socket ${socket.id}`);
  });

  // call user
  socket.on("callUser", ({ from, to, offer, isVideo }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("incomingCall", { from, offer, isVideo });
    }
  });

  // answer call
  socket.on("answerCall", ({ to, answer }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callAnswered", { answer });
    }
  });

  // reject call
  socket.on("rejectCall", ({ to }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callRejected");
    }
  });

  // ICE candidates
  socket.on("iceCandidate", ({ to, candidate }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("iceCandidate", { candidate });
    }
  });

  // end call
  socket.on("endCall", ({ to }) => {
    const targetSocket = users[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callEnded");
    }
  });

  socket.on("disconnect", () => {
    for (const [username, id] of Object.entries(users)) {
      if (id === socket.id) delete users[username];
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


