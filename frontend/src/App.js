import React, { useState, useEffect } from "react";
import socket from "./utils/socket";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import "./styles/App.css";

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

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => localStorage.setItem("contacts", JSON.stringify(contacts)), [contacts]);
  useEffect(() => localStorage.setItem("messages", JSON.stringify(messages)), [messages]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (user) socket.emit("registerSocket", user.username);
  }, [user]);

  const sendMessage = (text) => {
    if (!text.trim() || !selectedUser) return;

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [
        ...(prev[selectedUser] || []),
        { sender: "me", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));
  };

  if (!user) return <Login setUser={setUser} setContacts={setContacts} />;

  return (
    <div className="app-container">
      {/* Sidebar */}
      {(!isMobile || !selectedUser) && (
        <Sidebar
          user={user}
          contacts={contacts}
          setContacts={setContacts}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      )}

      {/* Chat Window */}
      {(!isMobile || selectedUser) && (
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages[selectedUser] || []}
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
}

export default App;

