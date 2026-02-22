export const initSocket=(io)=>{
    io.on('connection', (socket) => {
        console.log('socket connected: ${socket.id}');
        // ─── JOIN STREAM ROOM ──────────────────────────────
    socket.on("stream:join", ({ streamId }) => {
      socket.join(`stream_${streamId}`);
      console.log(`User joined stream room: ${streamId}`);
    });
     // ─── LEAVE STREAM ROOM ─────────────────────────────
    socket.on("stream:leave", ({ streamId }) => {
      socket.leave(`stream_${streamId}`);
    });
     // ─── CHAT MESSAGE ──────────────────────────────────
    socket.on("chat:send", ({ streamId, message, username, avatar }) => {
      // Basic validation
      if (!message || message.trim().length === 0) return;
      if (message.length > 500) return;

      // Broadcast to everyone in the stream room
      io.to(`stream_${streamId}`).emit("chat:receive", {
        username,
        avatar,
        message: message.trim(),
        sentAt:  new Date(),
      });
    });
    //----disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};
