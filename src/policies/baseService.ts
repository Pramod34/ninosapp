"use strict";
// import { Utilities } from "./utilities";
import log4js = require("log4js");
const _ = require("lodash");

export class BaseService {
    protected log: log4js.Logger;
    protected _: _.LoDashStatic;
    constructor() {
        this._ = _;
        this.log = log4js.getLogger(this.constructor.name);
    }
}
