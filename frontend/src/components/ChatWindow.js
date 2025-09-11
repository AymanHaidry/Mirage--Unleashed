import chatBg from "../assets/chat-bg.jpeg";
import React, { useState, useEffect, useRef } from "react";
import { createPeerConnection } from "../utils/webrtc";

function ChatWindow({ socket, user, selectedUser }) {
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [statuses, setStatuses] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [call, setCall] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  // handle messages
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

    // incoming call
    socket.on("incomingCall", async ({ from, offer, isVideo }) => {
      setIncomingCall({ from, offer, isVideo });
    });

    socket.on("callAnswered", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("callRejected", () => {
      alert("📵 Call rejected");
      endCall();
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      }
    });

    socket.on("callEnded", () => {
      alert("📴 Call ended");
      endCall();
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("updateStatus");
      socket.off("incomingCall");
      socket.off("callAnswered");
      socket.off("callRejected");
      socket.off("iceCandidate");
      socket.off("callEnded");
    };
  }, [socket]);

  // send message
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

  // call functions
  const startCall = async (isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(socket, stream, (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }, selectedUser);

      peerRef.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        from: user.username,
        to: selectedUser,
        offer,
        isVideo,
      });

      setCall({ with: selectedUser, isVideo });
    } catch (err) {
      console.error("Error starting call", err);
    }
  };

  const answerCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(socket, stream, (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }, incomingCall.from);

      peerRef.current = pc;

      await pc.setRemoteDescription(incomingCall.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", { to: incomingCall.from, answer });
      setCall({ with: incomingCall.from, isVideo: incomingCall.isVideo });
      setIncomingCall(null);
    } catch (err) {
      console.error("Error answering call", err);
    }
  };

  const rejectCall = () => {
    socket.emit("rejectCall", { to: incomingCall.from });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    socket.emit("endCall", { to: call?.with });
    setCall(null);
  };

  if (!selectedUser) {
    return <div className="chat-window">Select a contact to start chatting</div>;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        Mirage | Chatting with {selectedUser} (
        {statuses[selectedUser] ? "🟢 Online" : "⚪ Offline"})
        <div className="call-buttons">
          <button onClick={() => startCall(false)}>📞</button>
          <button onClick={() => startCall(true)}>🎥</button>
        </div>
      </div>

      <div className="chat-messages">
        {(messages[selectedUser] || []).map((msg, i) => (
          <div
            key={i}
            className={`chat-bubble ${
              msg.from === user.username ? "own" : "other"
            }`}
          >
            <b>{msg.from}</b>: {msg.text}
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
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>

      {/* Incoming Call Popup */}
      {incomingCall && (
        <div className="incoming-call">
          <p>📞 {incomingCall.from} is calling ({incomingCall.isVideo ? "Video" : "Voice"})</p>
          <button onClick={answerCall}>Accept</button>
          <button onClick={rejectCall}>Reject</button>
        </div>
      )}

      {/* Active Call */}
      {call && (
        <div className="call-window">
          <video ref={localVideoRef} autoPlay playsInline muted />
          <video ref={remoteVideoRef} autoPlay playsInline />
          <button onClick={endCall}>End Call</button>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;



