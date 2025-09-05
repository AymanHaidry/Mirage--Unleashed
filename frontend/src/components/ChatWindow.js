import React, { useState, useEffect } from "react";

function ChatWindow({ socket, user, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [statuses, setStatuses] = useState({}); // online/offline

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (msg.from === selectedUser) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("updateStatus", ({ username, online }) => {
      setStatuses((prev) => ({ ...prev, [username]: online }));
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("updateStatus");
    };
  }, [socket, selectedUser]);

  const sendMessage = () => {
    if (!input.trim() || !selectedUser) return;

    const messageData = {
      from: user.username,
      to: selectedUser,
      text: input,
      time: new Date(),
    };

    socket.emit("sendMessage", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!selectedUser) {
    return <div className="chat-window">Select a contact to start chatting</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        Chatting with {selectedUser} (
        {statuses[selectedUser] ? "🟢 Online" : "⚪ Offline"})
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.from === user.username ? "own" : ""}`}
          >
            <b>{msg.from}: </b>
            {msg.text}
            <div className="timestamp">
              {new Date(msg.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow;

