import React, { useState, useEffect } from "react";
import socket from "./utils/socket";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import "./styles/App.css";

function App() {
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (user) {
      socket.emit("registerSocket", user.username);
    }
  }, [user]);

  if (!user) {
    return <Login setUser={setUser} setContacts={setContacts} />;
  }

  return (
    <div className="app-container">
      <Sidebar
        user={user}
        contacts={contacts}
        setContacts={setContacts}
        setSelectedUser={setSelectedUser}
      />
      <ChatWindow socket={socket} user={user} selectedUser={selectedUser} />
    </div>
  );
}

export default App;


