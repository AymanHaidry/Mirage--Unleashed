import React, { useState } from "react";
import axios from "axios";
import "../styles/App.css"; // your main CSS

function Sidebar({ user, contacts, setContacts, setSelectedUser }) {
  const [newContact, setNewContact] = useState("");

  const addContact = async () => {
    if (!newContact.trim()) return;
    try {
      const res = await axios.post(
        "https://mirage-server-concordia.onrender.com/addContact",
        { owner: user.username, contact: newContact }
      );
      setContacts(res.data.contacts);
      setNewContact("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add contact");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="sidebar">
      {/* --- Premium Header --- */}
      <div className="sidebar-header">
        <h2 className="username">{user.username}</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* --- Add Contact --- */}
      <div className="add-contact">
        <input
          type="text"
          placeholder="Add contact"
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
        />
        <button onClick={addContact}>+</button>
      </div>

      {/* --- Contact List --- */}
      <ul>
        {contacts.map((c, i) => (
          <li key={i} onClick={() => setSelectedUser(c)}>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;




