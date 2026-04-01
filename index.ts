import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http'; // Use HTTP instead of HTTPS for local dev
import { redisClient } from './configs/RedisConfig';
import useBattle from './socket/useBattle';

const app = express();
const server = createServer(app);

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));



const socketio = new Server(server, {
  cors: { origin: ['*'], methods:["POST", "GET", "DELETE", "UPDATE"] },
  'pingTimeout': 5000,
  connectionStateRecovery: {
    'maxDisconnectionDuration': 1000,
  }
});



socketio.on('connection', (socket) => {
  const {joinBattle, createBattleRoom, sendInBattleMessage, finishBattle, leaveBattleRoom, startBattle, peformAttack, swapPokemon, handleTimeout}=useBattle(socket, socketio);

  // PRE-GAMEPLAY EVENTS  

  socket.on('join-battle-room', joinBattle);

  socket.on('create-battle-room', createBattleRoom);

  socket.on("leave-battle-room", leaveBattleRoom);
  
  // GAMEPLAY EVENTS
  socket.on('start-battle', startBattle);

  socket.on('finish-battle', finishBattle);

  socket.on('send-in-battle-message', sendInBattleMessage);
  
  socket.on('perform-move', peformAttack);

  socket.on('swap-pokemon', swapPokemon);

  socket.on('handle-timeout', handleTimeout);

  // DISCONNECTION & RECONNECTION EVENTS
  

  socket.on('disconnect', () => {
    socket.emit("disconnected-msg", {message:'You have been disconnected from the server.'})
  });

});

server.listen(2137, () => {
  console.log('Server is running on port 2137');
});
