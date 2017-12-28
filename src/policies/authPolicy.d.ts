import restify = require("restify");
export declare function IsAuthenticated(req: restify.Request, res: restify.Response, next: restify.Next): any;
export declare function TokenRefresh(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any>;
