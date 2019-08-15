const socketEvents = io => {
  io.on("connect", socket => {
    console.log("socket connected ", socket.connected);

    const users = [];
    const room = 1;

    socket.on("enterroom", () => {
      socket.join(room);
      if (users.length > 1) {
        socket.emit("roomFilled", "too many users");
        socket.leave(room);
      } else {
        users.push(socket.id);
        console.log("entered video chat ", users);
      }
    });

    socket.on("localdescription", details => {
      socket.broadcast.to(room).emit("localdescription", details);
      console.log("localdescription");
    });

    socket.on("streamerdescription", details => {
      socket.broadcast.to(room).emit("streamerdescription", details);
      console.log("streamer description ", room);
    });

    socket.on("recipientdescription", details => {
      socket.broadcast.to(room).emit("recipientdescription", details);
      console.log("recipient description ", details);
    });

    socket.on("icecandidate", details => {
      socket.broadcast.to(room).emit("newice", details);
    });

    socket.on("closestream", () => {
      socket.broadcast.to(room).emit("closestream");
      console.log("stream closed ");
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected ", socket.connected);
    });
  });
};

module.exports = socketEvents;
