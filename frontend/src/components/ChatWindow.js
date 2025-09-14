import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function ChatWindow({ socket, user, selectedUser, messages, setMessages }) {
  const [text, setText] = useState("");
  const fileInputRef = useRef();
  const messagesEndRef = useRef();
  const pcRef = useRef(null);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ from, message }) => {
      setMessages(prev => ({
        ...prev,
        [from]: [...(prev[from] || []), message],
      }));

      if (document.hidden && Notification.permission === "granted") {
        new Notification(`Message from ${from}`, {
          body: message.text || message.name || "File",
        });
      }
      socket.emit("messageDelivered", { to: from, messageId: message.id });
    };

    const handleCallOffer = ({ from }) => {
      if (Notification.permission === "granted") {
        new Notification(`Incoming call from ${from}`, { body: "Click to answer" });
      }
    };

    socket.on("privateMessage", handleIncoming);
    socket.on("call-offer", handleCallOffer);

    return () => {
      socket.off("privateMessage", handleIncoming);
      socket.off("call-offer", handleCallOffer);
    };
  }, [socket, setMessages]);

  const sendMessage = () => {
    if (!text.trim() || !selectedUser) return;

    const msg = {
      id: Date.now().toString(),
      sender: user,
      text,
      time: new Date().toLocaleTimeString(),
      status: "sent",
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), msg],
    }));

    socket.emit("privateMessage", { to: selectedUser, message: msg });
    setText("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post("https://mirage-server-concordia.onrender.com/upload", fd);

    const msg = {
      id: Date.now().toString(),
      sender: user,
      type: "file",
      name: file.name,
      fileUrl: res.data.url,
      time: new Date().toLocaleTimeString(),
      status: "sent",
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), msg],
    }));

    socket.emit("privateMessage", { to: selectedUser, message: msg });
  };

  const startCall = async () => {
    if (!selectedUser) return;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById("localVideo").srcObject = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = e => {
      document.getElementById("remoteVideo").srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) socket.emit("ice-candidate", { to: selectedUser, candidate: e.candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call-offer", { to: selectedUser, offer });

    socket.on("call-answer", async ({ answer }) => {
      await pc.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      await pc.addIceCandidate(candidate);
    });
  };

  return (
    <div className="chat-window-container">
      {selectedUser ? (
        <>
          {/* Header with Call button left, Name right */}
          <div className="chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={startCall}>📞 Call</button>
            <span className="chat-header-name">{selectedUser}</span>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, overflowY: "auto" }}>
            {messages[selectedUser]?.map(m => (
              <div key={m.id} className={`bubble ${m.sender === user ? "me" : "other"}`}>
                {m.type === "file" ? (
                  m.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={m.fileUrl} alt={m.name} style={{ maxWidth: "150px", borderRadius: "10px" }} />
                  ) : (
                    <a href={m.fileUrl} target="_blank" rel="noreferrer">{m.name}</a>
                  )
                ) : (
                  m.text
                )}
                <div className="timestamp">
                  {m.time} {m.status === "sent" && "✓"} {m.status === "delivered" && "✓✓"}{" "}
                  {m.status === "read" && "✓✓ (blue)"}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input pinned at bottom */}
          <div className="chat-input" style={{ display: "flex", padding: "12px 15px", borderTop: "1px solid #ddd", background: "#fafafa" }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid #ccc", fontSize: "16px" }}
            />
            <button onClick={sendMessage} style={{ marginLeft: "10px", borderRadius: "20px", background: "#128c7e", color: "#fff", fontWeight: "bold", border: "none", padding: "10px 18px", cursor: "pointer" }}>Send</button>
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()} style={{ marginLeft: "5px", borderRadius: "20px", background: "#075e54", color: "#fff", border: "none", padding: "10px 14px", cursor: "pointer" }}>📂</button>
          </div>

          <video id="localVideo" autoPlay playsInline muted width="150" />
          <video id="remoteVideo" autoPlay playsInline width="150" />
        </>
      ) : (
        <div className="empty-chat">Select a user to chat</div>
      )}
    </div>
  );
}

