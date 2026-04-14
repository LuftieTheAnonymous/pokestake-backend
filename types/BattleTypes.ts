export const MAX_TURN_DURATION = 30_000; // 30 seconds
export const MAX_BATTLE_DURATION_TIME= 1_800_000; // 30 minutes 

export type PokemonBattler= {
  name: string;
  rarityLevel: number;
  hp: number;
  pokemonId: number;
  pokedexId: number;
  maxHp: number;
  attack: number;
  defense: number;
  sprites:{front:string, back:string},
  cries: {legacy:`https://${string}.ogg` | null | undefined, latest:`https://${string}.ogg` | null | undefined}
}

export type Player={
playerNickname?:string,
currentPokemon:PokemonBattler,
pokemonDeck:PokemonBattler[]
}

export interface BattleRoom{
    host: `0x${string}` | null,
    creationTime:number,
    roomId: string | null,
    isBattleStarted:boolean,
    isBattleFinished:boolean,
    startTime:number | null,
    finishTime:number | null,
    participantsAllowed: [`0x${string}`, `0x${string}`] | [],
    currentTurn: 'host' | 'invitee' | null,
    turnChangedAt: number | null,
    turnNumber: number,
    hostPlayer: Player | null,
    inviteePlayer:Player | null,
    moveHistory: MoveAction[];
}

export type MoveAction = {
  turn: number;
  player: 'host' | 'invitee';
  moveType: 'attack' | 'switch' | 'timeout'; // or whatever moves you have
  attack?:{
    attacker: PokemonBattler;
    dmgDealt: number;
    targetPokemon: PokemonBattler;
  }; // For attack
  switch?:{
    initialPokemon: PokemonBattler,
    targetPokemon: PokemonBattler
  }; // For switch
  timestamp: number; 
};