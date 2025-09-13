// ChatWindow.js
import React, { useState, useRef } from "react";
import axios from "axios";

export default function ChatWindow({ socket, user, selectedUser, messages, setMessages }) {
  const [text, setText] = useState("");
  const fileInputRef = useRef();

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: user,
      text,
      time: new Date().toLocaleTimeString(),
      status: "sent",
    };
    setMessages((prev) => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), msg],
    }));
    socket.emit("privateMessage", { to: selectedUser, message: msg });
    setText("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post("http://localhost:5000/upload", fd);
    const msg = {
      id: Date.now().toString(),
      sender: user,
      type: "file",
      name: file.name,
      fileUrl: res.data.url,
      time: new Date().toLocaleTimeString(),
      status: "sent",
    };
    setMessages((prev) => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), msg],
    }));
    socket.emit("privateMessage", { to: selectedUser, message: msg });
  };

  // CALLS (WebRTC minimal)
  const startCall = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    document.getElementById("localVideo").srcObject = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      document.getElementById("remoteVideo").srcObject = e.streams[0];
    };

    pc.onicecandidate = (e) => {
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
          <div className="chat-header">
            <span className="chat-header-name">{selectedUser}</span>
            <button onClick={startCall}>📞 Call</button>
          </div>

          <div className="chat-messages">
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${m.sender === user ? "me" : "other"}`}>
                {m.type === "file" ? (
                  m.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img src={m.fileUrl} alt={m.name} width="150" />
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
          </div>

          <div className="chat-input">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type..." />
            <button onClick={sendMessage}>Send</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <button onClick={() => fileInputRef.current.click()}>📂</button>
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
