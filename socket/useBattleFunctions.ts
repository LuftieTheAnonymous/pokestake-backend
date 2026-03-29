import { DefaultEventsMap, Server, Socket } from "socket.io";
import useSocketMiddlewares from "./socketMiddlewares";
import { BattleRoom, Player } from "../types/BattleTypes";
import { redisClient } from "../configs/RedisConfig";



export default function useBattleFunctions(socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socketio:Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
){
const {unAuthenticatedMiddleware, validRoomIdMiddleware, walletAddress}=useSocketMiddlewares(socket);

 const joinBattle = async (roomId:number, playerDetails:Player)=>{
    unAuthenticatedMiddleware();
    await validRoomIdMiddleware(roomId);
    
    const batlleRoom = await redisClient.get(`battle-room:${roomId}`);
    if(!batlleRoom){
      socket.emit("invalid-battle-room", {error:`Battle Room with id (${roomId}) has not been found.`, data:null});
      return;
    }

    const battleRoomDetails = JSON.parse(batlleRoom) as BattleRoom;

    let participantValueToChange:BattleRoom = !battleRoomDetails.inviteePlayer && battleRoomDetails.host !== walletAddress ? {
      ...battleRoomDetails,
      inviteePlayer: playerDetails, 
    } : {
      ...battleRoomDetails,
      hostPlayer: playerDetails, 
    };

    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(participantValueToChange));

    socket.join(`${roomId}`);
    socket.emit("join-response", {data:{message:`You have joined the battle-room (ID: ${roomId})`}, error:null});
    socketio.to(`${roomId}`).emit('player-joined', {message:`Player ${walletAddress} joined the game-session. Let's start the grand-battle !`})
  }

  const createBattleRoom = async (roomId:number, hostPlayerDetails:Player, invitee:`0x${string}`)=>{
    unAuthenticatedMiddleware();

    const battleRoomTemplate:BattleRoom={
      creationTime: new Date().getTime(),
      host: socket.handshake.auth.walletAddress,
      isBattleStarted:false,
      isBattleFinished:false,
      turnChangedAt:undefined,
      moveHistory:[],
      participantsAllowed:[socket.handshake.auth.walletAddress, invitee],
      hostPlayer:hostPlayerDetails,
      inviteePlayer:undefined,
      turnNumber:0,
      startTime:undefined,
      finishTime:undefined,
    };

    const existingBattleRoom = await redisClient.get(`battle-room:${roomId}`);

    if(existingBattleRoom){
      socket.emit("invalid-battle-room",{error:`Room with such Id already exists.`, data:null});
      return;
    }

    await redisClient.set(`battleRoom:${roomId}`, JSON.stringify(battleRoomTemplate));

    socket.join(`${roomId}`);

    socket.emit('room-created', {battleRoom:battleRoomTemplate, roomId});
  }

  const leaveBattleRoom = async (roomId:number)=>{
      if(socket.rooms.has(`${roomId}`)){
      const battleRoom = await redisClient.get(`battle-room:${roomId}`);
      
      if(!battleRoom){
        socket.emit("invalid-battle-room", {error:`Battle Room with id (${roomId}) has not been found.`, data:null});
        return;
      }
  
    const battleRoomDetails = JSON.parse(battleRoom) as BattleRoom;
  
    const battleRoomChanged: BattleRoom = socket.handshake.auth.walletAddress === battleRoomDetails.host ? {...battleRoomDetails, hostPlayer:undefined} : {...battleRoomDetails, inviteePlayer:undefined};
  
    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(battleRoomChanged)); 

    socket.leave(`${roomId}`);
    socketio.to(`${roomId}`).emit('player-left', {message:`Player ${walletAddress} left the game-session.`})
    socket.emit("leave-room-msg", {data:{message:`Bye hope to see you again :D`, status:200}, error:null});
  }
  else{
      socket.emit('not_member', {data:null, error:`You are not the member of the room ${roomId}`});
    }
    }

  const sendInBattleMessage = async (roomId:number, message:string)=>{
        if(!socket.rooms.has(`${roomId}`)){
          socket.emit("invalid-battle-room", {data:null, error:'You are not in the room !'});
          return;
        }
        socketio.to(`${roomId}`).emit("in-game-message",{message, sentBy:walletAddress})
  }

  const startBattle = async()=>{
    
  } 

  return {joinBattle, createBattleRoom, leaveBattleRoom, sendInBattleMessage}

}