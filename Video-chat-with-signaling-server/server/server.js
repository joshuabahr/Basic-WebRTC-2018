const express = require("express");
const path = require("path");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const socketEvents = require("./socketEvents");

socketEvents(io);

const port = 3000;

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

server.listen(port, () => {
  console.log(`app is listening on http://localhost:${port}`);
});
