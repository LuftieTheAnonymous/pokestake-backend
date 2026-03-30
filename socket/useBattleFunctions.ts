import { DefaultEventsMap, Server, Socket } from "socket.io";
import useSocketMiddlewares from "./socketMiddlewares";
import { BattleRoom, Player } from "../types/BattleTypes";
import { redisClient } from "../configs/RedisConfig";



export default function useBattleFunctions(socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socketio:Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
){
const {unAuthenticatedMiddleware, validRoomIdMiddleware, walletAddress}=useSocketMiddlewares(socket);

 const joinBattle = async (roomId:string, playerDetails:Player)=>{
    unAuthenticatedMiddleware();
    await validRoomIdMiddleware(roomId);
    
    const batlleRoom = await redisClient.get(`battle-room:${roomId}`);

    console.log("Battle Room found in Redis: ", batlleRoom);

    if(!batlleRoom){
      socket.emit("invalid-battle-room", {error:`Battle Room with id (${roomId}) has not been found.`, data:null});
      return;
    }

    const battleRoomDetails = JSON.parse(batlleRoom) as BattleRoom;

    let redisUpdatedState:BattleRoom = !battleRoomDetails.inviteePlayer && battleRoomDetails.host !== walletAddress ? {
      ...battleRoomDetails,
      inviteePlayer: playerDetails, 
    } : {
      ...battleRoomDetails,
      hostPlayer: playerDetails, 
    };

    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(redisUpdatedState));

    socket.join(`${roomId}`);
    socket.emit("join-response", {data:{message:`You have joined the battle-room (ID: ${roomId}) !`, battleRoomState:redisUpdatedState}, error:null});
    socketio.to(`${roomId}`).emit('player-joined', 
      {data:{message:`Player ${playerDetails.playerNickname ?? walletAddress} joined the game-session. Let's start the grand-battle !`,
         battleRoomState:redisUpdatedState}, error:null});
  }

  const createBattleRoom = async (roomId:string, hostPlayerDetails:Player, invitee:`0x${string}`)=>{
    unAuthenticatedMiddleware();

    const battleRoomTemplate:BattleRoom={
      creationTime: new Date().getTime(),
      roomId: roomId,
      host: socket.handshake.auth.walletAddress,
      isBattleStarted:false,
      isBattleFinished:false,
      turnChangedAt:null,
      moveHistory:[],
      participantsAllowed:[socket.handshake.auth.walletAddress, invitee],
      hostPlayer:hostPlayerDetails,
      inviteePlayer:null,
      turnNumber:0,
      currentTurn:null,
      startTime:null,
      finishTime:null,
    };

    const existingBattleRoom = await redisClient.get(`battle-room:${roomId}`);

    if(existingBattleRoom){
      socket.emit("invalid-battle-room",{error:`Room with such Id already exists.`, data:null});
      return;
    }

    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(battleRoomTemplate));

    socket.join(`${roomId}`);

    socket.emit('battle-room-created', {battleRoom:battleRoomTemplate, roomId});
  }

  const leaveBattleRoom = async (roomId:string)=>{
      if(socket.rooms.has(`${roomId}`)){
      const battleRoom = await redisClient.get(`battle-room:${roomId}`);
      
      if(!battleRoom){
        socket.emit("invalid-battle-room", {error:`Battle Room with id (${roomId}) has not been found.`, data:null});
        return;
      }
  
    const battleRoomDetails = JSON.parse(battleRoom) as BattleRoom;
  
    const battleRoomChanged: BattleRoom = socket.handshake.auth.walletAddress === battleRoomDetails.host ? {...battleRoomDetails, hostPlayer:null} : {...battleRoomDetails, inviteePlayer:null};
  
    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(battleRoomChanged)); 

    socket.emit("left-room", {data:{message:`You left the battle-room (ID: ${roomId}) !`, battleRoomState:battleRoomChanged}, error:null});
    socket.leave(`${roomId}`);
    socketio.to(`${roomId}`).emit('player-left', {data: {message:`Player ${walletAddress} left the game-session.`, battleRoomState:battleRoomChanged}, error:null});
  }
  else{
      socket.emit('not_member', {data:null, error:`You are not the member of the room ${roomId}`});
    }
    }

  const sendInBattleMessage = async (roomId:string, message:string)=>{
        if(!socket.rooms.has(`${roomId}`)){
          socket.emit("invalid-battle-room", {data:null, error:'You are not in the room !'});
          return;
        }
        socketio.to(`${roomId}`).emit("in-game-message",{message, sentBy:walletAddress})
  }

  const startBattle = async(roomId:number)=>{
    
  } 

  return {joinBattle, createBattleRoom, leaveBattleRoom, sendInBattleMessage}

}