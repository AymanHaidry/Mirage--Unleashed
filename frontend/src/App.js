import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import "./styles/App.css";

// connect to backend
const socket = io("http://localhost:5000"); // change to your server URL

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem("contacts");
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("messages");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // persist data
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  // resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // register socket for user
  useEffect(() => {
    if (user) {
      socket.emit("registerSocket", user.username);
    }
  }, [user]);

  // incoming msgs + receipts
  useEffect(() => {
    if (!user) return;

    socket.on("receiveMessage", ({ from, text }) => {
      setMessages((prev) => {
        const updated = {
          ...prev,
          [from]: [
            ...(prev[from] || []),
            {
              sender: from,
              text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "delivered",
              isOwn: false, // 👈 received msg
            },
          ],
        };
        localStorage.setItem("messages", JSON.stringify(updated));
        return updated;
      });

      // auto mark as read if chat open
      if (selectedUser === from) {
        socket.emit("messageRead", { from, to: user.username, text });
      }
    });

    socket.on("messageDelivered", ({ to, text }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        if (updated[to]) {
          const idx = updated[to].findIndex((m) => m.text === text && m.isOwn);
          if (idx !== -1) updated[to][idx].status = "delivered";
        }
        return updated;
      });
    });

    socket.on("messageRead", ({ from, text }) => {
      setMessages((prev) => {
        const updated = { ...prev };
        if (updated[from]) {
          const idx = updated[from].findIndex((m) => m.text === text && m.isOwn);
          if (idx !== -1) updated[from][idx].status = "read";
        }
        return updated;
      });
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDelivered");
      socket.off("messageRead");
    };
  }, [user, selectedUser]);

  // send msg
  const sendMessage = (text) => {
    if (!text.trim() || !selectedUser) return;

    const newMessage = {
      sender: user.username,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      isOwn: true, // 👈 sent msg
    };

    setMessages((prev) => {
      const updated = {
        ...prev,
        [selectedUser]: [...(prev[selectedUser] || []), newMessage],
      };
      localStorage.setItem("messages", JSON.stringify(updated));
      return updated;
    });

    socket.emit("sendMessage", { to: selectedUser, from: user.username, text });
  };

  if (!user) {
    return <Login setUser={setUser} setContacts={setContacts} />;
  }

  return (
    <div className="app-container">
      {/* sidebar always on desktop, toggle on mobile */}
      {(!isMobile || !selectedUser) && (
        <Sidebar
          user={user}
          contacts={contacts}
          setContacts={setContacts}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      )}

      {/* chat window OR placeholder */}
      {(!isMobile || selectedUser) && (
        selectedUser ? (
          <ChatWindow
            user={user.username}
            selectedUser={selectedUser}
            onBack={() => setSelectedUser(null)}
            isMobile={isMobile}
            messages={messages[selectedUser] || []}
            sendMessage={sendMessage}
          />
        ) : (
          <div className="empty-chat">
            <p>Select a user to start chatting 👈</p>
          </div>
        )
      )}
    </div>
  );
}

export default App;
