# Basic-WebRTC-2018

## Purpose

This repo is meant to provide a simple and up-to-date example of WebRTC video chat implementations. While many tutorials exist for WebRTC, they are nearly all out of date and feature deprecated methods.

---

### One-way-video

This is the simplest implementation of WebRTC. The local stream is displayed in one video element, a WebRTC peer connection occurs, and the 'streamed' content is shown in another video element. To try it out, simply open the index.html file in any browser.

---

### Two-way-video

Slightly more complicated implementation that creates two separate peer connections, and displays each streamed video. Again, to try it out, simply open the index.html file in any browser.

---

### Video-chat-with-signaling-server

This implementation explores a real-world example of an extremely simple WebRTC video chat program. Unlike the previous implementations, it requires a signaling server to create the initial peer connection between browsers. This is handled using Node.js/Express and Socket.io.

To test it out, `npm insall` or `yarn install` from within the folder. When that is done, `npm start` or `yarn start`. Visit http://localhost:3000 in two separate browser windows to create a connection.

---

### Pull requests

If you encounter any errors or bugs, or have any suggestions, please create a pull request. I welcome any and all contributions, so long as it keeps everything as simple as possible, and follows the current WebRTC documentation as closely as possbile.
