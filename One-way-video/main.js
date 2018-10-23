'use strict';

const requestStreamButton = document.getElementById('requestStream');
const endStreamButton = document.getElementById('endStream');

const streamingVideo = document.getElementById('streamingVideo');
const viewerVideo = document.getElementById('viewerVideo');

requestStreamButton.onclick = setUpStream;

const PC_CONFIG = null;
const mediaStreamConstraints = {
  audio: false,
  video: { width: 640, height: 480 }
};

let streamerPC;
let viewerPC;
let localStream;

function setUpStream() {
  console.log('media constraints ', mediaStreamConstraints);
  createPeerConnectionStreamer();
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .then(() => {
      startStream();
    })
    .catch(handleLocalMediaStreamError);
}

function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  streamingVideo.srcObject = mediaStream;
  mediaStream.getTracks().forEach(t => streamerPC.addTrack(t, mediaStream));
  console.log('localVideo ', streamerPC);
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
      console.log('local description', streamerPC.localDescription);
    })
    .catch(e => {
      console.log('error recipient set up ', e);
    });
}

function createPeerConnectionStreamer() {
  try {
    streamerPC = new RTCPeerConnection();
    streamerPC.onicecandidate = handleIceCandidate;
    streamerPC.ontrack = handleRemoteStreamAdded;
    streamerPC.onremovetrack = handleRemoteStreamRemoved;
    streamerPC.oniceconnectionstatechange = handleIceStateChange;
    console.log('Created RTCPeerConnection', streamerPC.localDescription);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', e.message);
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event ', event);
}

function handleRemoteStreamAdded(e) {
  const mediaStream = e.streams[0];
  streamingVideo.srcObject = mediaStream;
  console.log('track running ', streamingVideo.srcObject);
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed ', event);
  streamingVideo.srcObject = null;
}

function handleIceStateChange() {
  console.log('Ice state change ', viewerPC.iceConnectionState);
}
