import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import "./App.css"; // 👈 add your global CSS here

const socket = io("https://mirage-server-concordia.onrender.com");

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [user, setUser] = useState(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null);
  const [contacts, setContacts] = useState(localStorage.getItem("contacts") ? JSON.parse(localStorage.getItem("contacts")) : []);
  const [messages, setMessages] = useState(localStorage.getItem("messages") ? JSON.parse(localStorage.getItem("messages")) : {});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("user"));

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("username", username);
  }, [username]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  // Update message status
  const updateMessageStatus = (id, status) => {
    setMessages((prev) => {
      const updated = { ...prev };
      for (let u in updated) {
        updated[u] = updated[u].map((m) => (m.id === id ? { ...m, status } : m));
      }
      return updated;
    });
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = ({ from, message }) => {
      setMessages((prev) => {
        const newMessages = {
          ...prev,
          [from]: [...(prev[from] || []), message],
        };
        return newMessages;
      });

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`Message from ${from}`, {
          body: message.text || message.name || "File",
        });
      }

      socket.emit("messageDelivered", { to: from, messageId: message.id });
    };

    socket.on("privateMessage", handlePrivateMessage);
    socket.on("messageDelivered", ({ messageId }) => updateMessageStatus(messageId, "delivered"));
    socket.on("markRead", ({ ids }) => ids.forEach((id) => updateMessageStatus(id, "read")));

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      socket.off("messageDelivered");
      socket.off("markRead");
    };
  }, []);

  // Login
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
          const unread = (messages[u] || []).filter((m) => m.status !== "read").map((m) => m.id);
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
