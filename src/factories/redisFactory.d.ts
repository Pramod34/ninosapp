import redis = require("redis");
export interface RedisDB {
    dbPost: string;
    dbReportPost: string;
    dbUser: string;
}
export declare class RedisFactory {
    private log;
    redisClient: redis.RedisClient;
    private cfg;
    redisDB: RedisDB;
    multi: any;
    constructor();
    ConnectToRedis: (db: string) => Promise<void>;
    Disconnect: () => Promise<void>;
}
