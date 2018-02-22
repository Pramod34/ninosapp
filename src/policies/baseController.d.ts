import log4js = require("log4js");
import _ = require("lodash");
import dbTypes = require("../models/collections");
export declare class BaseController {
    protected log: log4js.Logger;
    protected _: _.LoDashStatic;
    constructor();
    protected GetUser: (req: any) => dbTypes.IAuth;
    protected ErrorResult: (error: any, req: any, res: any, next: any) => any;
    protected lower_Uniq_Trim: (value: string | string[]) => any;
}
