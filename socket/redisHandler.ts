import { redisClient } from "../configs/RedisConfig";
import { BattleRoom } from "../types/BattleTypes";

export const getBattleRoom = async (roomId:string):Promise<BattleRoom | null>=>{
    const battleRoomData = await redisClient.get(`battle-room:${roomId}`);

    if(!battleRoomData){
        return null;
    }

    return JSON.parse(battleRoomData) as BattleRoom;
}

export const updateBattleRoom = async (roomId:string, updatedBattleRoom:BattleRoom):Promise<void>=>{
    await redisClient.set(`battle-room:${roomId}`, JSON.stringify(updatedBattleRoom));
}