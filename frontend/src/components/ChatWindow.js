import React, { useState, useEffect, useRef } from "react";
import "../styles/App.css";

function ChatWindow({ selectedUser, messages, sendMessage, user }) {
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
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
      {/* --- Header --- */}
      <div className="chat-header">
        <div className="chat-header-name">{selectedUser}</div>
        <div className="chat-header-status">Online</div>
      </div>

      {/* --- Chat Messages --- */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`bubble ${msg.sender === user.username ? "me" : "other"}`}
          >
            {msg.text}
            <div className="timestamp">{msg.time}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input --- */}
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






