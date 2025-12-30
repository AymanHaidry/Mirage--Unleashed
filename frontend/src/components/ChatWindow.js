import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";
import Picker from "emoji-picker-react";

function ChatWindow({ socket, user, selectedUser, onBack, isMobile, messages, sendMessage }) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {isMobile && <button onClick={onBack}>←</button>}
        <h3>{selectedUser || "Select a chat"}</h3>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <div className="empty-chat">No messages yet — say hello 👋</div>}
        {messages.map((msg, idx) => <Message key={idx} msg={msg} />)}
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

        <button className="icon-btn" onClick={() => setShowEmoji(s => !s)}>😊</button>
        <button onClick={handleSend} className="chat-send">Send</button>
      </div>

      {showEmoji && (
        <div className="emoji-picker">
          <Picker onEmojiClick={onEmojiClick} />
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
