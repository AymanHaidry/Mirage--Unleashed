import React, { useState, useRef, useEffect } from "react";

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, sendMessage }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // auto scroll
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

  const renderStatus = (msg) => {
    if (msg.sender !== "me") return null;

    if (msg.status === "sent") return <span className="tick">✓</span>;
    if (msg.status === "delivered") return <span className="tick">✓✓</span>;
    if (msg.status === "read") return <span className="tick read">✓✓</span>;
    return null;
  };

  return (
    <div className="chat-window">
  <div className="chat-header">
    {isMobile && <button onClick={onBack}>←</button>}
    <h3>{selectedUser}</h3>
  </div>

  <div className="chat-messages">
    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`message-bubble ${msg.sender === "me" ? "sent" : "received"}`}
      >
        <div className="text">{msg.text}</div>
        <div className="meta">
          <span className="time">{msg.time}</span>
          {msg.sender === "me" && (
            <span className={`tick ${msg.status}`}>✓✓</span>
          )}
        </div>
      </div>
    ))}
    <div ref={messagesEndRef} />
  </div>

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

        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;

