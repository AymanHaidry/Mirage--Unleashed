import React, { useState, useEffect, useRef } from "react";
import "./ChatWindow.css"; // you can style bubbles here

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [statuses, setStatuses] = useState({});
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  // Socket listeners
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        const updated = { ...prev };
        if (!updated[msg.from]) updated[msg.from] = [];
        updated[msg.from].push(msg);
        return updated;
      });
    });

    socket.on("updateStatus", ({ username, online }) => {
      setStatuses((prev) => ({ ...prev, [username]: online }));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("updateStatus");
    };
  }, [socket, setMessages]);

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;

    const messageData = {
      from: user.username,
      to: selectedUser,
      text: input,
      time: new Date(),
    };

    // send to server
    socket.emit("sendMessage", messageData);

    // update local chat
    setMessages((prev) => {
      const updated = { ...prev };
      if (!updated[selectedUser]) updated[selectedUser] = [];
      updated[selectedUser].push(messageData);
      return updated;
    });

    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // If no chat opened yet
  if (!selectedUser) {
    return (
      <div className="chat-window flex items-center justify-center h-full text-2xl font-[cursive] text-brown-700 text-center">
        Select a contact to start chatting
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        {isMobile && (
          <button className="back-btn" onClick={onBack}>
            ↩
          </button>
        )}
        <span>
          {selectedUser} ({statuses[selectedUser] ? "🟢 Online" : "⚪ Offline"})
        </span>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {(messages[selectedUser] || []).map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.from === user.username ? "own" : "other"}`}
          >
            <div className="bubble-text">{msg.text}</div>
            <div className="timestamp">
              {new Date(msg.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}

export default ChatWindow;
