"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("config");
const redis = require("redis");
const log4js = require("log4js");
var bb = require("bluebird");
class RedisFactory {
    constructor() {
        this.ConnectToRedis = (db) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.redisClient !== null && this.redisClient !== undefined)
                    this.redisClient.quit();
                this.redisClient = yield redis.createClient({ password: this.cfg.password, host: this.cfg.host, port: this.cfg.port, db: db });
            }
            catch (error) {
                this.log.error("factory -> ", error);
            }
        });
        this.Disconnect = () => __awaiter(this, void 0, void 0, function* () {
            this.redisClient.quit();
        });
        this.cfg = config_1.get("redis");
        this.redisDB = config_1.get("redis-dbs");
        bb.promisifyAll(redis);
        this.log = log4js.getLogger(this.constructor.name);
    }
}
exports.RedisFactory = RedisFactory;

//# sourceMappingURL=redisFactory.js.map
