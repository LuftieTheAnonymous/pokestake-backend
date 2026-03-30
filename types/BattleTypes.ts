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
  moveType: 'attack' | 'switch'; // or whatever moves you have
  targetPokemon?: string; // For attack
  switchToPokemon?: string; // For switch
  timestamp: number;
  result?: any; // damage dealt, etc.
};