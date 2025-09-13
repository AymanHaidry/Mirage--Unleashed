import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";   // 👈 add this

const socket = io("http://localhost:5000");

export default function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    socket.on("privateMessage", ({ from, message }) => {
      setMessages((prev) => ({
        ...prev,
        [from]: [...(prev[from] || []), message],
      }));

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`Message from ${from}`, {
          body: message.text || message.name || "File",
        });
      }

      socket.emit("messageDelivered", { to: from, messageId: message.id });
    });

    socket.on("messageDelivered", ({ messageId }) => {
      updateMessageStatus(messageId, "delivered");
    });

    socket.on("markRead", ({ ids }) => {
      ids.forEach((id) => updateMessageStatus(id, "read"));
    });

    return () => {
      socket.off("privateMessage");
      socket.off("messageDelivered");
      socket.off("markRead");
    };
  }, []);

  const updateMessageStatus = (id, status) => {
    setMessages((prev) => {
      const updated = { ...prev };
      for (let user in updated) {
        updated[user] = updated[user].map((m) =>
          m.id === id ? { ...m, status } : m
        );
      }
      return updated;
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    if (Notification && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  if (!isLoggedIn) {
    return (
      <Login
        username={username}
        setUsername={setUsername}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h3>Contacts</h3>
        <ul>
          {Object.keys(messages).map((u) => (
            <li
              key={u}
              className={selectedUser === u ? "active" : ""}
              onClick={() => {
                setSelectedUser(u);
                const unread = (messages[u] || [])
                  .filter((m) => m.status !== "read")
                  .map((m) => m.id);
                if (unread.length) {
                  socket.emit("markRead", { to: u, ids: unread });
                }
              }}
            >
              {u}
            </li>
          ))}
        </ul>
      </div>
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

