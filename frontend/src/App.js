import React, { useState, useEffect } from "react";
import socket from "./utils/socket";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import "./styles/App.css";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [contacts, setContacts] = useState(() => {
    const savedContacts = localStorage.getItem("contacts");
    return savedContacts ? JSON.parse(savedContacts) : [];
  });

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("messages");
    return savedMessages ? JSON.parse(savedMessages) : {};
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Save to localStorage
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => localStorage.setItem("contacts", JSON.stringify(contacts)), [contacts]);
  useEffect(() => localStorage.setItem("messages", JSON.stringify(messages)), [messages]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket register
  useEffect(() => {
    if (user) socket.emit("registerSocket", user.username);
  }, [user]);

  // Function to send message
  const sendMessage = (text) => {
    if (!text.trim() || !selectedUser) return;

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [
        ...(prev[selectedUser] || []),
        { sender: "me", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));

    // You can emit via socket here if needed
    // socket.emit("privateMessage", { to: selectedUser, text });
  };

  if (!user) return <Login setUser={setUser} setContacts={setContacts} />;

  return (
    <div className="app-container">
      {(!isMobile || !selectedUser) && (
        <Sidebar
          user={user}
          contacts={contacts}
          setContacts={setContacts}
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      )}

      {(!isMobile || selectedUser) && (
        <ChatWindow
          selectedUser={selectedUser}
          messages={messages[selectedUser] || []} // fallback to empty array
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
}

export default App;
