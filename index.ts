import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http'; // Use HTTP instead of HTTPS for local dev
import { redisClient } from './configs/RedisConfig';
import useSocketFunction from './socket/useBattleFunctions';

const app = express();
const server = createServer(app);

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));



const socketio = new Server(server, {
  cors: { origin: ['http://localhost:3000', 'https://localhost:3000'], methods:["POST", "GET", "DELETE", "UPDATE"] },
  connectionStateRecovery: {
    'maxDisconnectionDuration': 1000
  }
});



socketio.on('connection', (socket) => {
  const {joinBattle, createBattleRoom, leaveBattleRoom}=useSocketFunction(socket, socketio);

  socket.on('join-battle', joinBattle);

  socket.on('create-room', createBattleRoom);

  socket.on("leave-room", leaveBattleRoom);
    
  socket.on('disconnect', () => {
    socket.emit("disconnected-msg", {message:'You have been disconnected from the server.'})
  });

});

server.listen(2137, () => {
  console.log('Server running on port 2137');
});
