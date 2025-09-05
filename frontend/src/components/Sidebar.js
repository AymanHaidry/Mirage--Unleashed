import React, { useState } from "react";
import axios from "axios";

function Sidebar({ user, contacts, setContacts, setSelectedUser }) {
  const [newContact, setNewContact] = useState("");

  const addContact = async () => {
    if (!newContact.trim()) return;
    try {
      const res = await axios.post("http://localhost:5000/addContact", {
        owner: user.username,
        contact: newContact,
      });
      setContacts(res.data.contacts);
      setNewContact("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add contact");
    }
  };

  return (
    <div className="sidebar">
      <h3>Contacts</h3>
      <div className="add-contact">
        <input
          type="text"
          placeholder="Add contact"
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
        />
        <button onClick={addContact}>+</button>
      </div>
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

