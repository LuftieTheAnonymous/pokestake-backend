import { DefaultEventsMap, Socket } from "socket.io"
import { redisClient } from "../configs/RedisConfig";
import { BattleRoom } from "../types/BattleTypes";
import { getBattleRoom } from "./redisHandler";



function useSocketMiddlewares(socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  const walletAddress = socket.handshake.auth.walletAddress;
  
  const isAuthenticated = walletAddress && walletAddress.startsWith("0x") && walletAddress.length === 42;

// PRE-GAMEPLAY EVENTS

  const unAuthenticatedMiddleware =()=>{
       if (!isAuthenticated) {
    socket.emit('no_auth', { error: "No successful authentication obtained.", data:null });
    return;
  }
}
const validRoomIdMiddleware= async (roomId:string)=>{
  if(!roomId || isNaN(Number(roomId)) || roomId.toString().length !== 6){
    socket.emit('invalid-battle-room', {error:'Invalid Id of the room has been provided !', data:null});
    return;
  }

  const battleRoom = await getBattleRoom(roomId);
  if(!battleRoom){
     socket.emit('invalid-battle-room', {error:`There is no battle-room with id of ${roomId}`, data:null});
     return;
  }

  const isWalletParticipant = battleRoom.participantsAllowed.find((participant)=>participant === walletAddress);

  if(!isWalletParticipant){
    socket.emit('invalid-battle-room', {error:`You are not allowed to join ${roomId}`, data:null})
    return;
  }
}

const isBattleRoomNotExisiting = async(roomId:string)=>{
    const battleRoom = await getBattleRoom(roomId);

    if(!battleRoom){
      socket.emit("invalid-battle-room", {error:`Battle Room with id (${roomId}) has not been found.`, data:null});
      return;
    }
}

const isExisitingBattleRoom = async(roomId:string)=>{
   const existingBattleRoom = await getBattleRoom(roomId);

    if(existingBattleRoom){
      socket.emit("invalid-battle-room",{error:`Room with such Id already exists.`, data:null});
      return;
    }
};

const battleRoomStopCasesMiddleware = async(roomId:string)=>{
     const existingBattleRoom = await getBattleRoom(roomId) as BattleRoom;
     
     const hostTurnCase = existingBattleRoom.currentTurn === 'host' && existingBattleRoom.host !== walletAddress;
     const inviteeTurnCase = existingBattleRoom.host === walletAddress && existingBattleRoom.currentTurn === 'invitee'


     if(!existingBattleRoom.isBattleStarted){
      socket.emit('invalid-battle-room', {error:`The battle in room ${roomId} has not started yet.`, data:null});
      return;
     }

     if(hostTurnCase || inviteeTurnCase){
      socket.emit('invalid-battle-room', {error:`It's not your turn now ! Wait until it's your turn.`, data:null});
      return;
     }
      if(existingBattleRoom.isBattleFinished){
        socket.emit('invalid-battle-room', {error:`The battle in room ${roomId} has already finished.`, data:null});
        return;
      }

}

const isNotParticipant = (roomId:string)=>{
  if(!socket.rooms.has(roomId)){
    socket.emit('invalid-battle-room', {data:null, error:`You are not a participant of the room ${roomId}`});
    return;
  }
}

return {walletAddress, unAuthenticatedMiddleware, battleRoomStopCasesMiddleware, validRoomIdMiddleware, isBattleRoomNotExisiting, isExisitingBattleRoom, isNotParticipant}
}

export default useSocketMiddlewares