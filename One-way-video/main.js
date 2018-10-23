'use strict';

const startStreamButton = document.getElementById('startStream');
const sendStreamButton = document.getElementById('sendStream');
const endStreamButton = document.getElementById('endStream');

const streamingVideo = document.getElementById('streamingVideo');
const viewerVideo = document.getElementById('viewerVideo');

startStreamButton.onclick = setUpStream;
sendStreamButton.onclick = startStream;
endStreamButton.onclick = endStream;

// PC_CONFIG is where any STUN or TURN servers would be listed
const PC_CONFIG = null;

// mediaStreamConstraints describes the media that will be streamed
const mediaStreamConstraints = {
  audio: false,
  video: { width: 640, height: 480 }
};

let streamerPC;
let viewerPC;
let localStream;

function setUpStream() {
  createStreamerPeerConnection();
  createViewerPeerConnection();
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .catch(handleLocalMediaStreamError);
}

function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  streamingVideo.srcObject = mediaStream;
  mediaStream.getTracks().forEach(t => streamerPC.addTrack(t, mediaStream));
}

function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function startStream() {
  streamerPC
    .createOffer()
    .then(offer => {
      return streamerPC.setLocalDescription(offer);
    })
    .then(() => {
      console.log('streamer pc ', streamerPC.localDescription);
      console.log('viewer pc ', viewerPC);
      setUpViewer(streamerPC.localDescription);
    })
    .catch(e => {
      console.log('error recipient set up ', e);
    });
}

function setUpViewer(sdp) {
  viewerPC.setRemoteDescription(sdp);
  viewerPC
    .createAnswer()
    .then(answer => {
      return viewerPC.setLocalDescription(answer);
    })
    .then(() => {
      return streamerPC.setRemoteDescription(viewerPC.localDescription);
    });
  console.log('viewer pc ', viewerPC);
}

function createStreamerPeerConnection() {
  try {
    streamerPC = new RTCPeerConnection();
    streamerPC.onicecandidate = handleIceCandidateStreamer;
    streamerPC.ontrack = handleRemoteStreamAddedStreamer;
    streamerPC.onremovetrack = handleRemoteStreamRemovedStreamer;
    streamerPC.oniceconnectionstatechange = handleIceStateChangeStreamer;
    console.log('Created RTCPeerConnection', streamerPC.localDescription);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', e.message);
  }
}

function createViewerPeerConnection() {
  try {
    viewerPC = new RTCPeerConnection();
    viewerPC.onicecandidate = handleIceCandidateViewer;
    viewerPC.ontrack = handleRemoteStreamAddedViewer;
    viewerPC.onremovetrack = handleRemoteStreamRemovedViewer;
    viewerPC.oniceconnectionstatechange = handleIceStateChangeViewer;
    console.log('Created RTCPeerConnection', viewerPC.localDescription);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', e.message);
  }
}

function handleIceCandidateStreamer(event) {
  console.log('icecandidate event streamer', event);
}

function handleIceCandidateViewer(event) {
  console.log('icecandidate event viewer', event);
}

function handleRemoteStreamAddedStreamer(e) {
  const mediaStream = e.streams[0];
  streamingVideo.srcObject = mediaStream;
  console.log('track running ', streamingVideo.srcObject);
}

function handleRemoteStreamAddedViewer(e) {
  const mediaStream = e.streams[0];
  viewerVideo.srcObject = mediaStream;
  console.log('track running ', streamingVideo.srcObject);
}

function handleRemoteStreamRemovedStreamer(event) {
  console.log('Remote stream removed ', event);
  streamingVideo.srcObject = null;
}

function handleRemoteStreamRemovedViewer(event) {
  console.log('Remote stream removed ', event);
  viewerVideo.srcObject = null;
}

function handleIceStateChangeStreamer() {
  if (streamerPC) {
    console.log('Ice state change streamer', streamerPC.iceConnectionState);
  } else {
    console.log('connection ended');
  }
}

function handleIceStateChangeViewer() {
  if (viewerPC) {
    console.log('Ice state change viewer', viewerPC.iceConnectionState);
  } else {
    console.log('connection ended');
  }
}

function endStream() {
  viewerPC.close();
  streamerPC.close();
  const tracks = streamingVideo.srcObject.getTracks();
  tracks.forEach(track => track.stop());
  streamingVideo.srcObject = null;
  viewerVideo.srcObject = null;
  streamerPC = null;
  viewerPC = null;
}
