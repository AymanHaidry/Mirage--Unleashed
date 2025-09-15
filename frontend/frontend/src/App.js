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

  // Structure: { "Alice": [{sender, text, time}, ...], "Bob": [...] }
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("messages");
    return savedMessages ? JSON.parse(savedMessages) : {};
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Save user, contacts, messages to localStorage
  useEffect(() => { if (user) localStorage.setItem("user", JSON.stringify(user)); }, [user]);
  useEffect(() => localStorage.setItem("contacts", JSON.stringify(contacts)), [contacts]);
  useEffect(() => localStorage.setItem("messages", JSON.stringify(messages)), [messages]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Register socket
  useEffect(() => {
    if (user) socket.emit("registerSocket", user.username);
  }, [user]);

  // Listen for incoming messages
  useEffect(() => {
    if (!user) return;

    socket.on("receiveMessage", ({ from, text }) => {
      setMessages(prev => ({
        ...prev,
        [from]: [
          ...(prev[from] || []),
          { sender: from, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]
      }));
    });

    return () => socket.off("receiveMessage");
  }, [user]);

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
          socket={socket}
          user={user}
          selectedUser={selectedUser}
          onBack={() => setSelectedUser(null)}
          isMobile={isMobile}
          messages={messages[selectedUser] || []}
          sendMessage={(text) => {
            if (!text.trim() || !selectedUser) return;

            // Add locally
            setMessages(prev => ({
              ...prev,
              [selectedUser]: [
                ...(prev[selectedUser] || []),
                { sender: "me", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              ]
            }));

            // Emit to server
            socket.emit("sendMessage", {
              to: selectedUser,
              from: user.username,
              text
            });
          }}
        />
      )}
    </div>
  );
}

export default App;

