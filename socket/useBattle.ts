import { DefaultEventsMap, Server, Socket } from "socket.io";
import useSocketMiddlewares from "./socketMiddlewares";
import { BattleRoom, MAX_TURN_DURATION, MoveAction, Player, PokemonBattler } from "../types/BattleTypes";
import { getBattleRoom, updateBattleRoom } from "./redisHandler";
import { error } from "node:console";

export default function useBattle(socket:Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socketio:Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
){
const {unAuthenticatedMiddleware, validRoomIdMiddleware, walletAddress, isBattleRoomNotExisiting, isExisitingBattleRoom, isNotParticipant, battleRoomStopCasesMiddleware}=useSocketMiddlewares(socket);

 const joinBattle = async (roomId:string, playerDetails:Player)=>{
    unAuthenticatedMiddleware();
    await validRoomIdMiddleware(roomId);
    await isBattleRoomNotExisiting(roomId);
        
    const battleRoom = await getBattleRoom(roomId) as BattleRoom;

    let redisUpdatedState:BattleRoom = !battleRoom.inviteePlayer && battleRoom.host !== walletAddress ? {
      ...battleRoom,
      inviteePlayer: playerDetails, 
    } : {
      ...battleRoom,
      hostPlayer: playerDetails, 
    };

    await updateBattleRoom(roomId, redisUpdatedState);

    socket.join(`${roomId}`);
    socket.emit("join-response", {data:{message:`You have joined the battle-room (ID: ${roomId}) !`, battleRoom:redisUpdatedState}, error:null});
    socketio.to(`${roomId}`).emit('player-joined', 
      {data:{message:`Player ${playerDetails.playerNickname ?? walletAddress} joined the game-session. Let's start the grand-battle !`,
         battleRoom:battleRoom}, error:null});
  }

  const createBattleRoom = async (roomId:string, hostPlayerDetails:Player, invitee:`0x${string}`)=>{
    unAuthenticatedMiddleware();
    isExisitingBattleRoom(roomId);

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

   
    await updateBattleRoom(roomId, battleRoomTemplate);

    socket.join(`${roomId}`);

    socket.emit('battle-room-created', {battleRoom:battleRoomTemplate, roomId});
  }

  const leaveBattleRoom = async (roomId:string)=>{
    await isBattleRoomNotExisiting(roomId);
    isNotParticipant(roomId);
  
    const battleRoom = await getBattleRoom(roomId) as BattleRoom;
    
    if(battleRoom.isBattleStarted && !battleRoom.isBattleFinished){
      battleRoom.isBattleFinished = true;
      battleRoom.finishTime = new Date().getTime();
      await updateBattleRoom(roomId, battleRoom);
      const winnerAddress = battleRoom.participantsAllowed.find(address => address !== walletAddress);
      socketio.to(`${roomId}`).emit('battle-finished', {data:{winnerAddress, message:`Player ${walletAddress} left the game-session. The battle is finished ! ${winnerAddress ? `The winner is ${winnerAddress}` : 'It\'s a tie!'}`, battleRoom}, error:null});
      socket.leave(`${roomId}`);
      return;
    }
        
    const battleRoomChanged: BattleRoom = socket.handshake.auth.walletAddress === battleRoom.host ? {...battleRoom, hostPlayer:null} : {...battleRoom, inviteePlayer:null};
  
    await updateBattleRoom(roomId, battleRoomChanged); 
      
    socket.emit("left-room", {data:{message:`You left the battle-room (ID: ${roomId}) !`, battleRoom:battleRoomChanged}, error:null});
    socket.leave(`${roomId}`);
    socketio.to(`${roomId}`).emit('player-left', {data: {message:`Player ${walletAddress} left the game-session.`, battleRoom:battleRoomChanged}, error:null});
}

  const sendInBattleMessage = async (roomId:string, message:string)=>{
    await isBattleRoomNotExisiting(roomId);
    isNotParticipant(roomId);
    socketio.to(`${roomId}`).emit("in-game-message", {message, sentBy:walletAddress, messageType:null});
  }

  const startBattle = async(roomId:string)=>{
    await isBattleRoomNotExisiting(roomId);
    const battleRoom = await getBattleRoom(roomId) as BattleRoom;

    if(battleRoom.isBattleStarted){
      socketio.to(`${roomId}`).emit('in-game-message',{message:'The Battle is started ! Do not try to ', messageType:"error"});
      return;
    }

    const generatedTRN = crypto.getRandomValues(new Uint8Array(1))[0];
    
    let startTimeWithCountDown = new Date().getTime() + 5000;
    battleRoom.currentTurn = generatedTRN % 2 === 0 ? 'host' : 'invitee';
    battleRoom.startTime = startTimeWithCountDown;
    battleRoom.turnChangedAt = startTimeWithCountDown; 

    socketio.to(roomId).emit('battle-started', {message:`Battle Started, Let's begin a battle ! ${battleRoom.currentTurn.toUpperCase()} begins !`, battleRoom})
  };

  const swapPokemon = async (roomId:string, pokemonBattler:PokemonBattler)=>{
    await isBattleRoomNotExisiting(roomId);
    await battleRoomStopCasesMiddleware(roomId);
    isNotParticipant(roomId);

    const battleRoom = await getBattleRoom(roomId) as BattleRoom;
    battleRoom.turnNumber++;

    if(walletAddress === battleRoom.host){
     let previousPokemon = battleRoom.hostPlayer!.currentPokemon;
     let playerMove:MoveAction = {moveType:'switch', player:'host', 'timestamp': new Date().getTime(), turn: battleRoom.turnNumber, switch:{
      initialPokemon:previousPokemon,
      targetPokemon: pokemonBattler,
     }};
      battleRoom.moveHistory.push(playerMove);
      battleRoom.hostPlayer!.currentPokemon = pokemonBattler;
      battleRoom.currentTurn = 'invitee';
      socketio.to(roomId).emit('pokemon-change',{data:{battleRoom, message:`${battleRoom.hostPlayer!.playerNickname ?? battleRoom.host} has swapped ${previousPokemon.name.toUpperCase()} for ${pokemonBattler.name.toUpperCase()} !`}, error:null});
      return;
    }

    if(walletAddress !== battleRoom.host){
      let previousPokemon = battleRoom.inviteePlayer!.currentPokemon;
      let playerMove:MoveAction = {moveType:'switch', player:'invitee', 'timestamp': new Date().getTime(), turn: battleRoom.turnNumber, switch:{
      initialPokemon:previousPokemon,
      targetPokemon: pokemonBattler,
     }};
      battleRoom.moveHistory.push(playerMove);
      battleRoom.inviteePlayer!.currentPokemon = pokemonBattler;
      battleRoom.currentTurn = 'host';
      socketio.to(roomId).emit('pokemon-change',{data:{battleRoom, message:`${battleRoom.inviteePlayer!.playerNickname ?? walletAddress} has swapped ${previousPokemon.name.toUpperCase()} for ${pokemonBattler.name.toUpperCase()} !`}, error:null});
      return;
    }
  };

  const handleTimeout = async(roomId:string)=>{
    await isBattleRoomNotExisiting(roomId);
    await battleRoomStopCasesMiddleware(roomId);
    
    const battleRoom = await getBattleRoom(roomId) as BattleRoom;

    if(new Date().getTime() - (battleRoom.turnChangedAt as number) > MAX_TURN_DURATION){
      battleRoom.turnNumber++;
      battleRoom.currentTurn = battleRoom.currentTurn === 'host' ? 'invitee' : 'host';
      battleRoom.turnChangedAt = new Date().getTime();

      await updateBattleRoom(roomId, battleRoom);

      const inviteeAddress = battleRoom.participantsAllowed.find(address => address !== battleRoom.host);

      socketio.to(roomId).emit('turn-timeout', {data:{message:`Player ${battleRoom.currentTurn === 'host' ? battleRoom.inviteePlayer!.playerNickname ?? inviteeAddress : battleRoom.hostPlayer!.playerNickname ?? battleRoom.host} has timed out ! It's now ${battleRoom.currentTurn === 'host' ? battleRoom.hostPlayer!.playerNickname ?? battleRoom.host : battleRoom.inviteePlayer!.playerNickname ?? walletAddress}'s turn.`, battleRoom}, error:null});
    }
  }

  const peformAttack= async(roomId:string)=>{
    await isBattleRoomNotExisiting(roomId);
    isNotParticipant(roomId);

    const battleRoom = await getBattleRoom(roomId) as BattleRoom;
    battleRoom.turnNumber++;

  const calcDamage = (attacker: PokemonBattler, defender: PokemonBattler) => {
   // Base calculation: scale rarity as a multiplier (1.0x to 1.3x), not additive
  const rarityMultiplier = 1.0 + (attacker.rarityLevel - 1) * 0.1; // 1.0, 1.1, 1.2, 1.3
  
  // Stat ratio with a floor so low defense doesn't get one-shot
  const statRatio = Math.max(0.5, attacker.attack / defender.defense);
  
  // Base damage before variance
  const base = Math.floor(statRatio * rarityMultiplier) + 1;
  
  // Crypto CSPRNG variance: 0.8-1.2 range (20% swing both ways)
  const randomByte = crypto.getRandomValues(new Uint8Array(1))[0]; // 0-255
  const normalizedRandom = randomByte / 255; // 0-1
  const variance = 0.8 + normalizedRandom * 0.4; // 0.8-1.2
  
  return Math.max(1, Math.floor(base * variance));
  };

    if(battleRoom.hostPlayer && battleRoom.inviteePlayer){
      const attacker = walletAddress === battleRoom.host ? battleRoom.hostPlayer!.currentPokemon : battleRoom.inviteePlayer!.currentPokemon;
      const defender = walletAddress === battleRoom.host ? battleRoom.inviteePlayer!.currentPokemon : battleRoom.hostPlayer!.currentPokemon;
      const trng = crypto.getRandomValues(new Uint32Array(1))[0];
      const attackDodged = trng % 25 === 0;
      const damageDealt = attackDodged ? 0 : calcDamage(attacker, defender);
      defender.hp = Math.max(0, defender.hp - damageDealt);

      let playerMove:MoveAction = {moveType:'attack', player:'host', 'timestamp': new Date().getTime(), turn: battleRoom.turnNumber, attack:{
        attacker: battleRoom.hostPlayer!.currentPokemon,
        dmgDealt: damageDealt,
        targetPokemon: battleRoom.inviteePlayer!.currentPokemon,
      }};

      battleRoom.moveHistory.push(playerMove);
      battleRoom.currentTurn = 'invitee';
      let message = attackDodged ? `${battleRoom.inviteePlayer!.currentPokemon!.name} dodged the attack !` : `${battleRoom.hostPlayer!.currentPokemon!.name} attacked ${battleRoom.inviteePlayer!.currentPokemon!.name} and dealt ${damageDealt} damage !`;

      socketio.to(roomId).emit('move-performed',{data:{battleRoom, damage: damageDealt, message}, error:null});
      return;
    }


  };

  const finishBattle = async(roomId:string)=>{
    await isBattleRoomNotExisiting(roomId);
    await battleRoomStopCasesMiddleware(roomId);

    const battleRoom = await getBattleRoom(roomId) as BattleRoom;
    
    battleRoom.isBattleFinished = true;
    battleRoom.finishTime = new Date().getTime();
    await updateBattleRoom(roomId, battleRoom);

    const inviteePokemonDeckHp = battleRoom.inviteePlayer!.pokemonDeck.reduce((acc, pokemon) => {acc += pokemon.hp; return acc;},0);
    const hostPokemonDeckHp = battleRoom.hostPlayer!.pokemonDeck.reduce((acc, pokemon) => {acc += pokemon.hp; return acc;},0);

    const winnerAddress = inviteePokemonDeckHp === 0 ? battleRoom.host : hostPokemonDeckHp === 0 ? walletAddress : null;

    // Place for ZKProofs for generating a proof of battle outcome.

    if(inviteePokemonDeckHp === 0 || hostPokemonDeckHp === 0){
      socketio.to(roomId).emit('battle-finished', {data:{winnerAddress, message:`Battle Finished ! The winner is ${winnerAddress} !`, battleRoom}, error:null});
      return;
    }
  
  };

  return {
    joinBattle, 
    createBattleRoom, 
    leaveBattleRoom, 
    sendInBattleMessage, 
    startBattle, 
    swapPokemon,
     handleTimeout, 
     peformAttack,
      finishBattle}

}