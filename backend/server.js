const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

let users = []; // { username, password, socketId, contacts: [] }

// ---------- FILE UPLOAD ----------
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
});

// ---------- AUTH ROUTES ----------
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "User already exists" });
  }
  users.push({ username, password, socketId: null, contacts: [] });
  return res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  res.json({ success: true, contacts: user.contacts });
});

app.post("/addContact", (req, res) => {
  const { owner, contact } = req.body;
  const ownerUser = users.find((u) => u.username === owner);
  const contactUser = users.find((u) => u.username === contact);

  if (!ownerUser || !contactUser) {
    return res.status(400).json({ error: "Invalid users" });
  }
  if (!ownerUser.contacts.includes(contact)) {
    ownerUser.contacts.push(contact);
  }
  return res.json({ success: true, contacts: ownerUser.contacts });
});

// ---------- SOCKET.IO ----------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("registerSocket", (username) => {
    const user = users.find((u) => u.username === username);
    if (user) {
      user.socketId = socket.id;
      io.emit("updateStatus", { username, online: true });
    }
  });

  // Normal message
  socket.on("sendMessage", ({ from, to, text, id }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("receiveMessage", {
        id,
        from,
        text,
        time: new Date(),
        status: "sent",
      });
      // notify sender message delivered
      socket.emit("messageDelivered", { messageId: id });
    }
  });

  // Delivery receipts
  socket.on("messageDelivered", ({ to, messageId }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("messageDelivered", { messageId });
    }
  });

  // Read receipts
  socket.on("markRead", ({ to, ids }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("markRead", { ids });
    }
  });

  // --- CALLS (WebRTC signaling) ---
  socket.on("call-offer", ({ to, offer }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("call-offer", { from: socket.id, offer });
    }
  });

  socket.on("call-answer", ({ to, answer }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("call-answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const recipient = users.find((u) => u.username === to);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("disconnect", () => {
    const user = users.find((u) => u.socketId === socket.id);
    if (user) {
      user.socketId = null;
      io.emit("updateStatus", { username: user.username, online: false });
    }
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ---------- START ----------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀🚀 Backend running on port ${PORT}`));

