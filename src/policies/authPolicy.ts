"use strict";

import jwt = require("jsonwebtoken");
// import { get } from "config";
var config = require('config');
import restify = require("restify");
import { logger } from "../app";

export function IsAuthenticated(req: restify.Request, res: restify.Response, next: restify.Next): any {
    try {
        // check header or url parameters or post parameters for token
        var token = req.headers["x-access-token"] || req.params.token;

        if (!token && req.body && req.body.token) {
            token = req.body.token; // check in req body
        }

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, config.get("auth.secret"), function (err, decoded) {
                if (err) {

                    if (err.message && err.message === "jwt expired") {
                        return res.json({ success: false, message: "Token expired." });
                    }

                    return res.json({ success: false, message: "Failed to authenticate token." });
                } else {
                    // if everything is good, save to request for use in other routes
                    // req.decoded = decoded;
                    next();
                }
            });

        } else {

            // if there is no token
            // return an error
            return res.send(403, {
                success: false,
                message: "No token provided."
            });

        }
    } catch (error) {
        logger.error("IsAuthenticate", error, token);
        return res.send(403, {
            success: false,
            message: "No token provided."
        });
    }
}