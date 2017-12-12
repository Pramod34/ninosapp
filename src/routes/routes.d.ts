import { Server } from "restify";
export declare class RoutesManager {
    private restify;
    private log;
    constructor(restify: Server);
    RegisterRoutes(): void;
}
