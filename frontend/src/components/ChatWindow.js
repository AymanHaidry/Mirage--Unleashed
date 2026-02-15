import React, { useState, useRef, useEffect } from "react";
import Picker from "emoji-picker-react";

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selectedUser) return;

    const newMessage = {
      sender: "me",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent"
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage]
    }));

    socket.emit("sendMessage", { to: selectedUser, from: user.username, text: input });
    setInput("");
    setShowEmoji(false);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {isMobile && <button className="back-btn" onClick={onBack}>←</button>}
        <div className="header-info">
          <h3>{selectedUser || "IDLE_CHANNEL"}</h3>
          <span className="status-dot"></span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.sender === "me" ? "sent" : "received"}`}>
            <div className="message-bubble">
              <p>{msg.text}</p>
              <div className="message-meta">
                <span>{msg.time}</span>
                {msg.sender === "me" && (
                  <span className={`status-icon ${msg.status}`}>
                    {msg.status === "read" ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button onClick={() => setShowEmoji(!showEmoji)} className="emoji-trigger">☺</button>
        <input 
            type="text" 
            value={input} 
            placeholder="ENCRYPTING MESSAGE..." 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>TRANSMIT</button>
        {showEmoji && <div className="emoji-popover"><Picker onEmojiClick={(d) => setInput(prev => prev + d.emoji)} /></div>}
      </div>
    </div>
  );
}

export default ChatWindow;
