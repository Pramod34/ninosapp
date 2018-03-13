"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const log4js = require("log4js");
const _ = require("lodash");
class BaseController {
    constructor() {
        this.GetUser = (req) => {
            var user;
            var token = req.headers["x-access-token"] || req.params.token;
            if (!token && req.body && req.body.token) {
                token = req.body.token;
            }
            if (token) {
                user = jwt.decode(token);
            }
            return user;
        };
        this.ErrorResult = (error, req, res, next) => {
            var finalMessage;
            if (error.errors !== undefined && error.errors.length > 0) {
                error.errors.map(x => this.log.error((x)));
            }
            if (typeof (error) === "string") {
                finalMessage = error;
            }
            else {
                finalMessage = error.name + " " + error.message;
            }
            var response = {
                "success": false,
                "message": finalMessage
            };
            this.log.error(finalMessage);
            res.send(500, response);
            return next();
        };
        this.lower_Uniq_Trim = (value) => {
            if (typeof value === "string") {
                return this._.toLower(this._.trim(value));
            }
            else
                return this._.uniq(value.map(t => this._.toLower(this._.trim(t))));
        };
        this._ = _;
        this.log = log4js.getLogger(this.constructor.name);
    }
}
exports.BaseController = BaseController;

//# sourceMappingURL=baseController.js.map
