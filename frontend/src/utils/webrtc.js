export function createPeerConnection(socket, localStream, onTrack, toUser) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // free STUN
    ],
  });

  // send ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("iceCandidate", { to: toUser, candidate: event.candidate });
    }
  };

  // when remote stream arrives
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };

  // add our local tracks
  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  return pc;
}
