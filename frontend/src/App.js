import React, { useState, useEffect } from "react";
import socket from "./utils/socket";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import "./styles/App.css";

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);
  const [contacts, setContacts] = useState(() => JSON.parse(localStorage.getItem("contacts")) || []);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("messages")) || {});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Persistence Sync
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("contacts", JSON.stringify(contacts));
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [user, contacts, messages]);

  // Socket Registration & Listeners
  useEffect(() => {
    if (!user) return;
    socket.emit("registerSocket", user.username);

    socket.on("receiveMessage", ({ from, text }) => {
      setMessages(prev => ({
        ...prev,
        [from]: [...(prev[from] || []), { sender: from, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: "delivered" }]
      }));
      if (selectedUser === from) socket.emit("messageRead", { from, to: user.username, text });
    });

    socket.on("messageDelivered", ({ to, text }) => {
      updateStatus(to, text, "delivered");
    });

    socket.on("messageRead", ({ from, text }) => {
      updateStatus(from, text, "read");
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDelivered");
      socket.off("messageRead");
    };
  }, [user, selectedUser]);

  const updateStatus = (contact, text, status) => {
    setMessages(prev => {
      const updated = { ...prev };
      if (updated[contact]) {
        const idx = updated[contact].findLastIndex(m => m.text === text && m.sender === "me");
        if (idx !== -1) updated[contact][idx].status = status;
      }
      return { ...updated };
    });
  };

  if (!user) return <Login setUser={setUser} setContacts={setContacts} />;

  return (
    <div className="app-container glass-theme">
      {(!isMobile || !selectedUser) && (
        <Sidebar user={user} contacts={contacts} setContacts={setContacts} setSelectedUser={setSelectedUser} selectedUser={selectedUser} />
      )}
      {(!isMobile || selectedUser) && (
        <ChatWindow 
            socket={socket} 
            user={user} 
            selectedUser={selectedUser} 
            onBack={() => setSelectedUser(null)} 
            isMobile={isMobile} 
            messages={messages[selectedUser] || []} 
            setMessages={setMessages}
        />
      )}
    </div>
  );
}

export default App;
