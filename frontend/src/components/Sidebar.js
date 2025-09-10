import React from "react";

function Sidebar({ user, contacts, setSelectedUser, selectedUser, onLogout }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🌌 Mirage</h2>
        <span className="username">@{user.username}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>

      <h3>Contacts</h3>
      <ul>
        {contacts.map((c, i) => (
          <li
            key={i}
            className={selectedUser === c ? "active" : ""}
            onClick={() => setSelectedUser(c)}
          >
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;

