import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";

const socket = io("https://mirage-server-concordia.onrender.com"); // Render backend

export default function App() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Update message status function
  const updateMessageStatus = (id, status) => {
    setMessages(prev => {
      const updated = { ...prev };
      for (let u in updated) {
        updated[u] = updated[u].map(m => (m.id === id ? { ...m, status } : m));
      }
      return updated;
    });
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({ from, message }) => {
      setMessages(prev => ({
        ...prev,
        [from]: [...(prev[from] || []), message],
      }));

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`Message from ${from}`, {
          body: message.text || message.name || "File",
        });
      }

      socket.emit("messageDelivered", { to: from, messageId: message.id });
    };

    const handleDelivered = ({ messageId }) => updateMessageStatus(messageId, "delivered");
    const handleMarkRead = ({ ids }) => ids.forEach(id => updateMessageStatus(id, "read"));

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("messageDelivered", handleDelivered);
    socket.on("markRead", handleMarkRead);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("messageDelivered", handleDelivered);
      socket.off("markRead", handleMarkRead);
    };
  }, []);

  // Login handling
  const handleLogin = () => {
    setIsLoggedIn(true);
    if (Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    socket.emit("registerSocket", username);
    setUser({ username });
  };

  if (!isLoggedIn || !user) {
    return (
      <Login
        username={username}
        setUsername={setUsername}
        setUser={setUser}
        setContacts={setContacts}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        contacts={contacts}
        setContacts={setContacts}
        selectedUser={selectedUser}
        setSelectedUser={(u) => {
          setSelectedUser(u);
          const unread = (messages[u] || []).filter(m => m.status !== "read").map(m => m.id);
          if (unread.length) socket.emit("markRead", { to: u, ids: unread });
        }}
      />
      <ChatWindow
        socket={socket}
        user={username}
        selectedUser={selectedUser}
        messages={messages[selectedUser] || []}
        setMessages={setMessages}
      />
    </div>
  );
}
