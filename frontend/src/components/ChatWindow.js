import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import Picker from "emoji-picker-react";

function ChatWindow({
  socket,
  user,
  selectedUser,
  onBack,
  isMobile,
  messages,
  sendMessage,
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput("");
    setShowEmoji(false);

    // keep focus for fast typing
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    inputRef.current?.focus(); // CRITICAL: restore focus
  };

  return (
    <div className="chat-window">
      {/* HEADER */}
      <div className="chat-header">
        {isMobile && <button onClick={onBack}>←</button>}
        <h3>{selectedUser || "Select a chat"}</h3>
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            No messages yet — say hello 👋
          </div>
        )}

        {messages.map((msg) => (
          <Message
            key={msg.id || msg.timestamp || Math.random()}
            msg={msg}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <input
          ref={inputRef}
          type="text"
          value={input}
          className="chat-textbox"
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          className="icon-btn"
          onClick={() => {
            setShowEmoji((s) => !s);
            inputRef.current?.focus();
          }}
        >
          😊
        </button>

        <button className="chat-send" onClick={handleSend}>
          Send
        </button>
      </div>

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div className="emoji-picker">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
