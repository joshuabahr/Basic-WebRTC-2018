"use strict";

const socket = io();

const startStreamButton = document.getElementById("startStream");
const sendStreamButton = document.getElementById("sendStream");
const endStreamButton = document.getElementById("endStream");
const acceptStreamButton = document.getElementById("acceptStream");

const localVideo = document.getElementById("streamingVideo");
const remoteVideo = document.getElementById("viewerVideo");
const PC_CONFIG = { iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }] };

acceptStreamButton.disabled = true;

startStreamButton.onclick = setUpStream;
sendStreamButton.onclick = setUpStreamer;
sendStreamButton.disabled = true;
endStreamButton.onclick = endStream;
acceptStreamButton.onclick = acceptStream;

let pc = null;
let localStream = null;
let remoteDescription;
const mediaStreamConstraints = {
  audio: false,
  video: { width: 640, height: 480 }
};

// enter socket room
socket.emit("enterroom");

async function setUpStream() {
  console.log("media constraints ", mediaStreamConstraints);
  await navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .then(() => {
      sendStreamButton.disabled = false;
    })
    .catch(handleLocalMediaStreamError);
}

async function acceptStream(description) {
  createPeerConnection();
  await setUpStream();
  console.log("setting accept stream", description);
  pc.setRemoteDescription(description)
    .then(() => {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    })
    .then(() => pc.createAnswer({ offerToReceiveVideo: true }))
    .then(answer => {
      console.log("answer ", answer);
      return pc.setLocalDescription(answer);
    })
    .then(() => {
      console.log("streamer this.pc ", pc);
      sendLocalDescription();
    })
    .catch(error => {
      console.log("error creating answer ", error);
    });
}

function setUpStreamer() {
  createPeerConnection();
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.createOffer({ offerToReceiveVideo: true })
    .then(offer => pc.setLocalDescription(offer))
    .then(() => {
      console.log("peer connection", pc.localDescription);
    })
    .then(() => {
      sendLocalDescription();
    })
    .catch(e => {
      console.log("error recipient set up ", e);
    });
}

function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
  console.log("localVideo ", localVideo);
  return;
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(PC_CONFIG);
    console.log("first pc ", pc.localDescription);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleRemoteStreamAdded;
    pc.onremovetrack = handleRemoteStreamRemoved;
    pc.oniceconnectionstatechange = handleIceStateChange;
    console.log("Created RTCPeerConnection", pc.localDescription);
  } catch (e) {
    console.log("Failed to create PeerConnection, exception: ", e.message);
  }
}

function handleIceCandidate(event) {
  console.log("icecandidate event ", event);
  if (event.candidate) {
    socket.emit("icecandidate", {
      type: "candidate",
      sdpMLineIndex: event.candidate.sdpMLineIndex,
      sdpMid: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log("End of Candidates");
  }
}

function handleNewIce() {
  socket.on("newice", details => {
    console.log("new ice candidate ", details);
    pc.addIceCandidate(details).catch(e =>
      console.log("failure to add ice candidate ", e.name)
    );
  });
}

function handleIceStateChange() {
  console.log("Ice state change ", pc.iceConnectionState);
}

function handleRemoteStreamAdded(e) {
  const mediaStream = e.streams[0];
  remoteVideo.srcObject = mediaStream;
  console.log("track running ", remoteVideo.srcObject);
}

function handleRemoteStreamRemoved(event) {
  console.log("Remote stream removed ", event);
  remoteVideo.srcObject = null;
}

function handleLocalMediaStreamError(error) {
  console.log("navigator.getUserMedia error: ", error);
}

function sendLocalDescription() {
  socket.emit("localdescription", pc.localDescription);
}

function sendStreamerDescription() {
  console.log("sending streamer description");
  socket.emit("streamerdescription", pc.localDescription);
}

function sendRecipientDescription() {
  console.log("sending recipient description 4", pc);
  socket.emit("recipientdescription", pc.localDescription);
}

function endStream() {
  socket.emit("closestream");
  if (pc) pc.close();
  stopStreamedVideo(localVideo);
  stopStreamedVideo(remoteVideo);
  socket.removeAllListeners();
}

function stopStreamedVideo(videoElem) {
  const stream = videoElem.srcObject;
  const tracks = stream.getTracks();
  tracks.forEach(track => {
    track.stop();
  });

  videoElem.srcObject = null;
}

// responses to socket emits
socket.on("localdescription", sdp => {
  if (pc) {
    pc.setRemoteDescription(sdp);
  } else {
    acceptStream(sdp);
  }
});

socket.on("recipientdescription", sdp => {
  console.log("recipient thingy");
  remoteDescription = sdp;
  acceptStreamButton.disabled = false;
});

socket.on("streamerdescription", sdp => {
  pc.setRemoteDescription(sdp).then(() => {
    console.log("streamer description added ", pc);
  });
});

socket.on("closestream", () => {
  if (pc) pc.close();
  stopStreamedVideo(remoteVideo);
});

socket.on("newice", details => {
  console.log("new ice candidate ", details);
  pc.addIceCandidate(details).catch(e =>
    console.log("failure to add ice candidate ", e.name)
  );
});
