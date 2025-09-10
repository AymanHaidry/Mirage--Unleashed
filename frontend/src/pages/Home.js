import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

function Home({ user }) {
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get(const res = await axios.get("https://mirage-server-concordia.onrender.com/users");
");
      setContacts(res.data.filter((u) => u !== user));
    };
    fetchUsers();
  }, [user]);

  return (
    <div className="app">
      <Sidebar contacts={contacts} setSelectedUser={setSelectedUser} />
      {selectedUser ? (
        <ChatWindow user={user} selectedUser={selectedUser} />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h2>Select a contact to start chatting</h2>
        </div>
      )}
    </div>
  );
}

export default Home;




