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

  const [selectedUser, setSelectedUser] = useState(
    localStorage.getItem("selectedUser") || null
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Persist state
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (selectedUser) localStorage.setItem("selectedUser", selectedUser);
  }, [selectedUser]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Register socket
  useEffect(() => {
    if (user) socket.emit("registerSocket", user.username);
  }, [user]);

  // Incoming messages
  useEffect(() => {
    if (!user) return;

    const handleReceive = ({ from, text }) => {
      setMessages(prev => {
        const updated = {
          ...prev,
          [from]: [
            ...(prev[from] || []),
            {
              sender: from,
              text,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        };

        // immediately persist
        localStorage.setItem("messages", JSON.stringify(updated));
        return updated;
      });
    };

    socket.on("receiveMessage", handleReceive);
    return () => socket.off("receiveMessage", handleReceive);
  }, [user]);

  if (!user) return <Login setUser={setUser} setContacts={setContacts} />;

  return (
    <div className="app-container">
      {(!isMobile || !selectedUser) && (
        <Sidebar
          user={user}
          contacts={contacts}
          setContacts={setContacts}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
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

            setMessages(prev => {
              const updated = {
                ...prev,
                [selectedUser]: [
                  ...(prev[selectedUser] || []),
                  {
                    sender: "me",
                    text,
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ],
              };
              localStorage.setItem("messages", JSON.stringify(updated));
              return updated;
            });

            socket.emit("sendMessage", {
              to: selectedUser,
              from: user.username,
              text,
            });
          }}
        />
      )}
    </div>
  );
}

export default App;
