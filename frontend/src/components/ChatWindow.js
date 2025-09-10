import React, { useState, useEffect, useRef } from "react";

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [statuses, setStatuses] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

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

  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;

    const messageData = {
      from: user.username,
      to: selectedUser,
      text: input,
      time: new Date(),
    };

    socket.emit("sendMessage", messageData);

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

  const handleAttachment = () => {
    document.getElementById("fileInput").click();
  };

  if (!selectedUser) {
    return <div className="chat-window">Select a contact to start chatting</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        {isMobile && (
          <button className="back-btn" onClick={onBack}>
            ←
          </button>
        )}
        <span>
          {selectedUser} ({statuses[selectedUser] ? "🟢 Online" : "⚪ Offline"})
        </span>
        <div className="chat-actions">
          <button title="Voice Call">📞</button>
          <button title="Video Call">🎥</button>
        </div>
      </div>

      <div className="chat-messages">
        {(messages[selectedUser] || []).map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${msg.from === user.username ? "own" : "other"}`}
          >
            <div className="bubble-text">{msg.text}</div>
            <div className="timestamp">
              {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <button onClick={handleAttachment}>📎</button>
        <input
          id="fileInput"
          type="file"
          style={{ display: "none" }}
          onChange={(e) => alert(`File selected: ${e.target.files[0].name}`)}
        />
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

