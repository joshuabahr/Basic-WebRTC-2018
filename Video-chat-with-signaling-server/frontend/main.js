"use strict";

const socket = io();

const startStreamButton = document.getElementById("startStream");
const sendStreamButton = document.getElementById("sendStream");
const endStreamButton = document.getElementById("endStream");
const acceptStreamButton = document.getElementById("acceptStream");

const streamingVideo = document.getElementById("streamingVideo");
const viewerVideo = document.getElementById("viewerVideo");

acceptStreamButton.disabled = true;

startStreamButton.onclick = setUpStream;
sendStreamButton.onclick = startStream;
endStreamButton.onclick = endStream;
acceptStreamButton.onclick = acceptStream;

// PC_CONFIG is where any STUN or TURN servers would be listed
const PC_CONFIG = null;

// mediaStreamConstraints describes the media that will be streamed
const mediaStreamConstraints = {
  audio: false,
  video: { width: 640, height: 480 }
};

let localPC;
let remoteDescription;
socket.emit("enterroom");

function setUpStream() {
  createPeerConnection();
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(getLocalMediaStream)
    .catch(handleLocalMediaStreamError);
}

function getLocalMediaStream(mediaStream) {
  streamingVideo.srcObject = mediaStream;
  mediaStream.getTracks().forEach(t => localPC.addTrack(t, mediaStream));
}

function handleLocalMediaStreamError(error) {
  console.log("navigator.getUserMedia error: ", error);
}

function startStream() {
  localPC
    .createOffer()
    .then(offer => {
      return localPC.setLocalDescription(offer);
    })
    .then(() => {
      socket.emit("streamerdescription", localPC.localDescription);
    })
    .catch(e => {
      console.log("error recipient set up ", e);
    });
}

socket.on("streamerdescription", details => {
  acceptStreamButton.disabled = false;
  remoteDescription = details;
});

function acceptStream() {
  console.log("accept stream", remoteDescription);
  setUpStream();
  localPC.setRemoteDescription(remoteDescription);
  localPC
    .createAnswer()
    .then(answer => localPC.setLocalDescription(answer))
    .then(() => {
      socket.emit("recipientdescription", localPC.localDescription);
    });
  console.log("local pc", localPC);
}

socket.on("recipientdescription", details => {
  console.log("recipientdescription", details);
  localPC.setRemoteDescription(details);
  console.log("recipient description", localPC);
});

// function setUpViewer(sdp) {
//   viewerPC.setRemoteDescription(sdp);
//   viewerPC
//     .createAnswer()
//     .then(answer => {
//       return viewerPC.setLocalDescription(answer);
//     })
//     .then(() => {
//       return localPC.setRemoteDescription(viewerPC.localDescription);
//     });
//   console.log("viewer pc ", viewerPC);
// }

function createPeerConnection() {
  try {
    localPC = new RTCPeerConnection();
    localPC.onicecandidate = handleIceCandidateStreamer;
    localPC.ontrack = handleRemoteStreamAddedStreamer;
    localPC.onremovetrack = handleRemoteStreamRemovedStreamer;
    localPC.oniceconnectionstatechange = handleIceStateChangeStreamer;
    console.log("Created RTCPeerConnection", localPC);
  } catch (e) {
    console.log("Failed to create PeerConnection, exception: ", e.message);
  }
}

// function createViewerPeerConnection() {
//   try {
//     viewerPC = new RTCPeerConnection();
//     viewerPC.onicecandidate = handleIceCandidateViewer;
//     viewerPC.ontrack = handleRemoteStreamAddedViewer;
//     viewerPC.onremovetrack = handleRemoteStreamRemovedViewer;
//     viewerPC.oniceconnectionstatechange = handleIceStateChangeViewer;
//     console.log("Created RTCPeerConnection", viewerPC.localDescription);
//   } catch (e) {
//     console.log("Failed to create PeerConnection, exception: ", e.message);
//   }
// }

function handleIceCandidateStreamer(event) {
  console.log("icecandidate event streamer", event);
}

// function handleIceCandidateViewer(event) {
//   console.log("icecandidate event viewer", event);
// }

function handleRemoteStreamAddedStreamer(e) {
  console.log("e", e);
  const mediaStream = e.streams[0];
  viewerVideo.srcObject = mediaStream;
  console.log("added streamer ", viewerVideo.srcObject);
  console.log("added streamer", localPC);
}

// function handleRemoteStreamAddedViewer(e) {
//   const mediaStream = e.streams[0];
//   viewerVideo.srcObject = mediaStream;
//   console.log("added viewer ", streamingVideo.srcObject);
// }

function handleRemoteStreamRemovedStreamer(event) {
  console.log("Remote stream removed ", event);
  viewerVideo.srcObject = null;
}

// function handleRemoteStreamRemovedViewer(event) {
//   console.log("Remote stream removed ", event);
//   viewerVideo.srcObject = null;
// }

function handleIceStateChangeStreamer() {
  if (localPC) {
    console.log("Ice state change streamer", localPC.iceConnectionState);
  } else {
    console.log("connection ended");
  }
}

// function handleIceStateChangeViewer() {
//   if (viewerPC) {
//     console.log("Ice state change viewer", viewerPC.iceConnectionState);
//   } else {
//     console.log("connection ended");
//   }
// }

function endStream() {
  // viewerPC.close();
  localPC.close();
  const tracks = streamingVideo.srcObject.getTracks();
  tracks.forEach(track => track.stop());
  streamingVideo.srcObject = null;
  viewerVideo.srcObject = null;
  localPC = null;
  // viewerPC = null;
}
