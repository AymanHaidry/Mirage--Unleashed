import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Receive messages
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", ({ from, text }) => {
      setMessages((prev) => [...prev, { from, text, type: "text" }]);
    });

    socket.on("receive-file", ({ from, fileName, fileData }) => {
      setMessages((prev) => [
        ...prev,
        { from, text: fileName, fileData, type: "file" },
      ]);
    });

    socket.on("incoming-call", ({ from }) => {
      alert(`📞 Incoming call from ${from}`);
    });

    return () => {
      socket.off("receive-message");
      socket.off("receive-file");
      socket.off("incoming-call");
    };
  }, [socket, setMessages]);

  const handleSend = () => {
    if (input.trim()) {
      socket.emit("send-message", { to: selectedUser, from: user, text: input });
      setMessages((prev) => [...prev, { from: user, text: input, type: "text" }]);
      setInput("");
    }
  };

  const handleFileSend = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = reader.result;
      socket.emit("send-file", {
        to: selectedUser,
        from: user,
        fileName: file.name,
        fileData,
      });
      setMessages((prev) => [
        ...prev,
        { from: user, text: file.name, fileData, type: "file" },
      ]);
      setFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCall = () => {
    socket.emit("call-user", { to: selectedUser, from: user });
    alert(`📤 Calling ${selectedUser}...`);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {isMobile && (
          <Button variant="ghost" onClick={onBack}>
            ⬅ Back
          </Button>
        )}
        <h2>{selectedUser}</h2>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.from === user ? "sent" : "received"}`}
          >
            {msg.type === "text" ? (
              msg.text
            ) : (
              <a href={msg.fileData} download={msg.text}>
                📎 {msg.text}
              </a>
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <Button onClick={handleSend}>Send</Button>
        <Button onClick={handleFileSend} disabled={!file}>
          Send File
        </Button>
        <Button onClick={handleCall}>📞 Call</Button>
      </div>
    </div>
  );
}

export default ChatWindow;






