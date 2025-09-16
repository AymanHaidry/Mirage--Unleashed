import React, { useState, useRef, useEffect } from "react";

function ChatWindow({ user, selectedUser, onBack, isMobile, messages, sendMessage }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  // If no user is selected → show placeholder
  if (!selectedUser) {
    return (
      <div className="chat-window empty-chat">
        <p>Select a user to start chatting 💬</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        {isMobile && <button onClick={onBack}>←</button>}
        <h3>{selectedUser}</h3>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-bubble ${msg.isOwn ? "sent" : "received"}`}
          >
            <div className="text">{msg.text}</div>
            <div className="meta">
              <span className="time">{msg.time}</span>
              {msg.isOwn && (
                <span className={`tick ${msg.status}`}>
                  {msg.status === "sent" && "✓"}
                  {msg.status === "delivered" && "✓✓"}
                  {msg.status === "read" && "✓✓"}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="chat-textbox"
        />
        <button onClick={handleSend} className="chat-send">Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;
