export type PokemonBattler= {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  sprites:{front:string, back:string}
}


export type Player={
playerNickname?:string,
currentPokemon:PokemonBattler,
pokemonDeck:PokemonBattler[]
}

export interface BattleRoom{
    host: `0x${string}`,
    creationTime:number,
    
    isBattleStarted:boolean,
    isBattleFinished:boolean,
    
    startTime?:number,
    finishTime?:number,
    
    participantsAllowed: [`0x${string}`, `0x${string}`],
    
    currentTurn?: 'host' | 'invitee',
    turnChangedAt?: number,
    turnNumber: number,

    hostPlayer?: Player,
    inviteePlayer?:Player

    moveHistory: MoveAction[];
}

export type MoveAction = {
  turn: number;
  player: 'host' | 'invitee';
  moveType: 'attack' | 'switch'; // or whatever moves you have
  targetPokemon?: string; // For attack
  switchToPokemon?: string; // For switch
  timestamp: number;
  result?: any; // damage dealt, etc.
};