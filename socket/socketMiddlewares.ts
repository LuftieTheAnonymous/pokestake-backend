import { DefaultEventsMap, Socket } from "socket.io"
import { redisClient } from "../configs/RedisConfig";
import { BattleRoom } from "../types/BattleTypes";



function useSocketMiddlewares(socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  const walletAddress = socket.handshake.auth.walletAddress;
  
  const isAuthenticated = walletAddress && walletAddress.startsWith("0x") && walletAddress.length === 42;

// PRE-GAMEPLAY EVENTS

  let unAuthenticatedMiddleware =()=>{
       if (!isAuthenticated) {
    socket.emit('no_auth', { error: "No successful authentication obtained.", data:null });
    return;
  }
}
let validRoomIdMiddleware= async (roomId:string)=>{
  if(!roomId || isNaN(Number(roomId)) || roomId.toString().length !== 6){
    socket.emit('invalid-battle-room', {error:'Invalid Id of the room has been provided !', data:null});
    return;
  }

  const redisObject = await redisClient.get(`battle-room:${roomId}`);
  if(!redisObject){
     socket.emit('invalid-battle-room', {error:`There is no battle-room with id of ${roomId}`, data:null});
     return;
  }

  const battleObjectResponse = JSON.parse(redisObject) as BattleRoom;
  const battleRoomFound = battleObjectResponse.participantsAllowed.find((participant)=>participant === walletAddress);

  if(!battleRoomFound){
    socket.emit('invalid-battle-room', {error:`You are not allowed to join ${roomId}`, data:null})
    return;
  }
}

return {walletAddress, unAuthenticatedMiddleware, validRoomIdMiddleware}
}

export default useSocketMiddlewares