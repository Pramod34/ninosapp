import { get } from "config";
import redis = require("redis");
import log4js = require("log4js");
var bb = require("bluebird");
export interface RedisDB {
    dbPost: string;
    dbReportPost: string;
    dbUser: string;
}


export class RedisFactory {

    private log: log4js.Logger;
    public redisClient: redis.RedisClient;
    private cfg: any;
    public redisDB: RedisDB;

    public multi;
    constructor() {
        this.cfg = get<any>("redis");
        this.redisDB = get<any>("redis-dbs");
        bb.promisifyAll(redis);

        this.log = log4js.getLogger(this.constructor.name);
    }
    /**
      * connects to the redis.
      */
    public ConnectToRedis = async (db: string): Promise<void> => {
        try {
            if (this.redisClient !== null && this.redisClient !== undefined)
                this.redisClient.quit();
            this.redisClient = await redis.createClient(<any>{ password: this.cfg.password, host: this.cfg.host, port: this.cfg.port, db: db });
        } catch (error) {
            this.log.error("factory -> ", error);
        }
    };
    /**
     * disconnects to the redis.
     */
    public Disconnect = async (): Promise<void> => {
        this.redisClient.quit();
    };

}
