"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js = require("log4js");
const _ = require("lodash");
class BaseService {
    constructor() {
        this._ = _;
        this.log = log4js.getLogger(this.constructor.name);
    }
}
exports.BaseService = BaseService;

//# sourceMappingURL=baseService.js.map
