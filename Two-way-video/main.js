'use strict';

const startStreamButton = document.getElementById('startStream');
const sendStreamButton = document.getElementById('sendStream');
const acceptStreamButton = document.getElementById('acceptStream');
const endStreamButton = document.getElementById('endStream');

const pc1LocalVideo = document.getElementById('pc1LocalVideo');
const pc2LocalVideo = document.getElementById('pc2LocalVideo');
const pc1StreamingVideo = document.getElementById('pc1StreamingVideo');
const pc2StreamingVideo = document.getElementById('pc2StreamingVideo');

startStreamButton.onclick = setUpPc1Stream;
sendStreamButton.onclick = startStream;
acceptStreamButton.onclick = setUpPc2;
endStreamButton.onclick = endStream;

acceptStreamButton.disabled = true;
sendStreamButton.disabled = true;
endStreamButton.disabled = true;

// _CONFIG is where any STUN or TURN servers would be listed
const PC_CONFIG = null;

// mediaStreamConstraints describes the media that will be streamed
const mediaStreamConstraints = {
  audio: false,
  video: { width: 640, height: 480 }
};

let pc1;
let pc2;

function setUpPc1Stream() {
  startStreamButton.disabled = true;
  sendStreamButton.disabled = false;
  createPc1PeerConnection();
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStreamPc1)
    .catch(handleLocalMediaError);
}

function setUpPc2Stream() {
  createPc2PeerConnection();
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStreamPc2)
    .catch(handleLocalMediaError);
}

function gotLocalMediaStreamPc1(mediaStream) {
  pc1LocalVideo.srcObject = mediaStream;
  mediaStream.getTracks().forEach(t => pc1.addTrack(t, mediaStream));
}

function gotLocalMediaStreamPc2(mediaStream) {
  pc2LocalVideo.srcObject = mediaStream;
  mediaStream.getTracks().forEach(t => pc2.addTrack(t, mediaStream));
}

function handleLocalMediaError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function startStream() {
  acceptStreamButton.disabled = false;
  sendStreamButton.disabled = true;
  pc1
    .createOffer()
    .then(offer => {
      return pc1.setLocalDescription(offer);
    })
    .then(() => {
      return setUpPc2Stream();
    })
    .catch(e => {
      console.log('error recipient set up ', e);
    });
}

function setUpPc2() {
  endStreamButton.disabled = false;
  acceptStreamButton.disabled = true;
  pc2.setRemoteDescription(pc1.localDescription);
  pc2
    .createAnswer()
    .then(answer => {
      return pc2.setLocalDescription(answer);
    })
    .then(() => {
      return pc1.setRemoteDescription(pc2.localDescription);
    });
  console.log('pc2  ', pc2);
}

function createPc1PeerConnection() {
  try {
    pc1 = new RTCPeerConnection();
    pc1.onicecandidate = handleIceCandidatePc1;
    pc1.ontrack = handleRemoteStreamAddedPc1;
    pc1.onremovetrack = handleRemoteStreamRemovedPc1;
    pc1.oniceconnectionstatechange = handleIceStateChangePc1;
    console.log('Created RTCPeerConnection', pc1.localDescription);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', e.message);
  }
}

function createPc2PeerConnection() {
  try {
    pc2 = new RTCPeerConnection();
    pc2.onicecandidate = handleIceCandidatePc2;
    pc2.ontrack = handleRemoteStreamAddedPc2;
    pc2.onremovetrack = handleRemoteStreamRemovedPc2;
    pc2.oniceconnectionstatechange = handleIceStateChangePc2;
    console.log('Created RTCPeerConnection', pc2.localDescription);
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', e.message);
  }
}

function handleIceCandidatePc1(event) {
  console.log('icecandidate event Pc1', event);
}

function handleIceCandidatePc2(event) {
  console.log('icecandidate event pc2', event);
}

function handleRemoteStreamAddedPc1(e) {
  const mediaStream = e.streams[0];
  pc1StreamingVideo.srcObject = mediaStream;
  console.log('track running ', pc1StreamingVideo.srcObject);
}

function handleRemoteStreamAddedPc2(e) {
  const mediaStream = e.streams[0];
  pc2StreamingVideo.srcObject = mediaStream;
  console.log('track running ', pc2StreamingVideo.srcObject);
}

function handleRemoteStreamRemovedPc1(event) {
  console.log('Remote stream removed ', event);
  pc1StreamingVideo.srcObject = null;
}

function handleRemoteStreamRemovedPc2(event) {
  console.log('Remote stream removed ', event);
  pc2StreamingVideo.srcObject = null;
}

function handleIceStateChangePc1() {
  if (pc1) {
    console.log('Ice state change Pc1', pc1.iceConnectionState);
  } else {
    console.log('connection ended');
  }
}

function handleIceStateChangePc2() {
  if (pc2) {
    console.log('Ice state change pc2', pc2.iceConnectionState);
  } else {
    console.log('connection ended');
  }
}

function endStream() {
  endStreamButton.disabled = true;
  startStreamButton.disabled = false;
  pc2.close();
  pc1.close();
  const tracks1 = pc1LocalVideo.srcObject.getTracks();
  const tracks2 = pc2LocalVideo.srcObject.getTracks();
  tracks1.forEach(track => track.stop());
  tracks2.forEach(track => track.stop());
  pc1LocalVideo.srcObject = null;
  pc2LocalVideo.srcObject = null;
  pc1StreamingVideo.srcObject = null;
  pc2StreamingVideo.srcObject = null;
  pc1 = null;
  pc2 = null;
}
