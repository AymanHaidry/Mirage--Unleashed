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

  // persist
  useEffect(() => { if (user) localStorage.setItem("user", JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem("contacts", JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem("messages", JSON.stringify(messages)); }, [messages]);

  // resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // register user with socket
  useEffect(() => {
    if (user) socket.emit("registerSocket", user.username);
  }, [user]);

  // listen for events
  useEffect(() => {
    if (!user) return;

    // incoming msg
    socket.on("receiveMessage", ({ from, text }) => {
      setMessages(prev => {
        const updated = {
          ...prev,
          [from]: [
            ...(prev[from] || []),
            {
              sender: from,
              text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "delivered" // recipient side
            }
          ]
        };
        localStorage.setItem("messages", JSON.stringify(updated));
        return updated;
      });

      // auto mark as read if currently viewing that chat
      if (selectedUser === from) {
        socket.emit("messageRead", { from, to: user.username, text });
      }
    });

    // delivery receipts
    socket.on("messageDelivered", ({ to, from, text }) => {
      setMessages(prev => {
        const updated = { ...prev };
        if (updated[to]) {
          const idx = updated[to].findIndex(m => m.text === text && m.sender === "me");
          if (idx !== -1) updated[to][idx].status = "delivered";
        }
        localStorage.setItem("messages", JSON.stringify(updated));
        return updated;
      });
    });

    // read receipts
    socket.on("messageRead", ({ from, text }) => {
      setMessages(prev => {
        const updated = { ...prev };
        if (updated[from]) {
          const idx = updated[from].findIndex(m => m.text === text && m.sender === "me");
          if (idx !== -1) updated[from][idx].status = "read";
        }
        localStorage.setItem("messages", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDelivered");
      socket.off("messageRead");
    };
  }, [user, selectedUser]);

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

            const newMessage = {
              sender: "me",
              text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "sent"
            };

            setMessages(prev => {
              const updated = {
                ...prev,
                [selectedUser]: [...(prev[selectedUser] || []), newMessage],
              };
              localStorage.setItem("messages", JSON.stringify(updated));
              return updated;
            });

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
