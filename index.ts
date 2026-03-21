import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http'; // Use HTTP instead of HTTPS for local dev

const app = express();
const server = createServer(app);

const socketio = new Server(server, {
  cors: { origin: ['http://localhost:3000'], methods:["POST", "GET", "DELETE", "UPDATE"] },
  connectionStateRecovery: {
    'maxDisconnectionDuration': 1000
  }
});

socketio.on('connection', (socket) => {
  const walletAddress = socket.handshake.auth.walletAddress;
  
  const isAuthenticated = walletAddress && 
                          walletAddress.startsWith("0x") && 
                          walletAddress.length === 42;


  socket.on('join-room',(roomId)=>{
   if (!isAuthenticated) {
    socket.emit('no_auth', { msg: "No authentication" });
    // socket.disconnect(true); // Disconnect immediately
    return;
  }
    socket.join(roomId);
    socket.emit("join-response", {message:`You have joined ${roomId}-room`});
  });

  socket.on('send-to-room', (roomId, message)=>{
    socketio.to(roomId).emit('message_to_room', message);
  });

  socket.on("leave-room", (roomId)=>{
    if(socket.rooms.has(roomId)){
    socket.leave(roomId);
    socket.emit("leave-room-msg", {message:'Bye hope to see you again :D'});
  }else{
socket.emit('not_member', {msg:`You are not the member of the room ${roomId}`});
  }

  });
    
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

});

server.listen(2137, () => {
  console.log('Server running on port 2137');
});
