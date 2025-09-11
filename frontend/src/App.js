import chatBg from "./assets/chat-bg.jpeg";
import loginBg from "./assets/login-bg.jpeg";
import "./App.css";

function App() {
  return (
    <div>
      <div
        className="chat-window"
        style={{ backgroundImage: `url(${chatBg})`, backgroundSize: "cover" }}
      >
        <h1>Chat Page</h1>
      </div>

      <div
        className="login-container"
        style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover" }}
      >
        <h1>Login Page</h1>
      </div>
    </div>
  );
}

export default App;

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

  // Save to localStorage whenever user, contacts, or messages change
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

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

  if (!user) {
    return <Login setUser={setUser} setContacts={setContacts} />;
  }

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
          messages={messages}
          setMessages={setMessages}
        />
      )}
    </div>
  );
}

export default App;



