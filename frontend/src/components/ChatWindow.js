import React, { useState, useEffect, useRef } from "react";
import "../styles/App.css";

function ChatWindow({ selectedUser, messages, sendMessage }) {
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    sendMessage(newMsg);
    setNewMsg("");
  };

  if (!selectedUser) {
    return (
      <div className="chat-window-container">
        <div className="empty-chat">
          Select a contact to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      {/* --- Header showing recipient --- */}
      <div className="chat-window-header">
        {selectedUser}
      </div>

      {/* --- Chat Messages --- */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.sender === "me" ? "me" : "other"}`}>
            {msg.text}
            <div className="timestamp">{msg.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Chat Input --- */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;




