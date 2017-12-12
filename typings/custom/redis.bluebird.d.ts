declare module "redis"
{
    export interface RedisClient {
        batch():Batch
        keysAsync(...args: any[]): Promise<any>;
        setAsync(...args: any[]): Promise<any>;
        delAsync(...args: any[]): Promise<any>;
        expireAsync(...args: any[]): Promise<any>;
        getAsync(...args: any[]): Promise<any>;

        hgetallAsync(...args: any[]): Promise<any>;
        hgetAsync(...args: any[]): Promise<any>;
        hdelAsync(...args: any[]): Promise<any>;
        hkeysAsync(...args: any[]): Promise<any>;
        hsetAsync(...args: any[]): Promise<any>;
        hlenAsync(...args: any[]): Promise<any>;
        hincrbyAsync(...args: any[]): Promise<any>;
        hmsetAsync(...args: any[]): Promise<any>;

        zrangeAsync(...args: any[]): Promise<any>;
        zrankAsync(...args: any[]): Promise<any>;
        zcardAsync(...args: any[]): Promise<any>;
        zremAsync(...args: any[]): Promise<any>;
        zrevrangeAsync(...args: any[]): Promise<any>;
        zincrbyAsync(...args: any[]): Promise<any>;
        zaddAsync(...args: any[]): Promise<any>;
        zscoreAsync(...args: any[]): Promise<any>;
        zrangebyscoreAsync(...args: any[]): Promise<any>;
        zremrangebyrankAsync(...args: any[]): Promise<any>;
        zrevrangebyscoreAsync(...args: any[]): Promise<any>;
        smembersAsync(...args: any[]): Promise<any>;
        saddAsync(...args: any[]): Promise<any>;
        sremAsync(...args: any[]): Promise<any>;
        scardAsync(...args: any[]): Promise<any>;
        sismemberAsync(...args: any[]): Promise<any>;
        lrangeAsync(...args: any[]): Promise<any>;
        lremAsync(...args: any[]): Promise<any>;
        lpushAsync(...args: any[]): Promise<any>;
        getsetAsync(args: any[], callback?: ResCallbackT<any>): boolean;
    }
    export interface Multi {
        execAsync(...args: any[]): Multi;
    }

    export interface Batch {
        execAsync(...args: any[]): Multi;
    }
}