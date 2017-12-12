"use strict";
import restify = require("restify");
import jwt = require("jsonwebtoken");
import log4js = require("log4js");
import _ = require("lodash");
import dbTypes = require("../models/collections");

export class BaseController  {
    protected log: log4js.Logger;
  protected _: _.LoDashStatic;
    constructor() {
                this._ = _;
        this.log = log4js.getLogger(this.constructor.name);
    }

    /**
     * @param  {restify.Request} restify http request
     * @returns User object.
     * (description) Gets the user from the restify request object by decoding the token.
     */
    protected GetUser = (req: restify.Request): dbTypes.IAuth => {
        var user: any

        var token = req.headers["x-access-token"] || req.params.token;

        if (!token && req.body && req.body.token) {
            token = req.body.token; // check in req body
        }

        // decode token
        if (token) {
            user = <dbTypes.IAuth>jwt.decode(token);
        }

        return user;
    };

    /**
     * @param  {any} error object
     * @param  {restify.Request} restify http request
     * @param  {restify.Response} restify http response
     * @param  {restify.Next} restify next handler
     * (description) sends the error response.
     */
    protected ErrorResult = (error: any, req: restify.Request, res: restify.Response, next: restify.Next) => {

        var finalMessage: string;
        if (error.errors !== undefined && error.errors.length > 0) {
            error.errors.map(x => this.log.error((x)));
        }
        if (typeof (error) === "string") {
            finalMessage = error;
        } else {
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

    protected lower_Uniq_Trim = (value: string | string[]): any => {
        if (typeof value === "string") {
            return this._.toLower(this._.trim(value));
        } else
            return this._.uniq(value.map(t => this._.toLower(this._.trim(t))));
    };
}
