"use strict";

import jwt = require("jsonwebtoken");
// import { get } from "config";
var config = require('config');
import restify = require("restify");
import { logger } from "../app";
import { mdbModels } from "../models/mdb";
import { UserAuthService as uAService } from "../services/userAuth/userAuthService";

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

export async function TokenRefresh(req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> {
    var user;
    try {
        // check header or url parameters or post parameters for token
        var token = req.headers["x-access-token"] || req.params.token;

        if (!token && req.body && req.body.token) {
            token = req.body.token; // check in req body
        }

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, config.get("auth.secret"), async (err, decoded) => {

                if (err) {
                    if (err.message !== "jwt expired") {
                        return res.json({ success: false, message: err.message });
                    }
                    user = jwt.decode(token);
                } else {
                    user = decoded;
                }

                // if (!decoded) {
                //     return res.json({ success: false, message: "Invalid Token. (don't send 'string' or invalid string)." });
                // }

                // create a token
                var jwtOptions = <jwt.SignOptions>{};
                jwtOptions.expiresIn = "7d";
                jwtOptions.noTimestamp = false;

                var query: any = await mdbModels.Auth.findOne({ email: user.email, userId: user.userId }).exec();

                if (!query) {

                    var userInfo = query._doc;
                    var newDate = new Date();

                    var userObj = user;

                    userObj.tokenDate = newDate.getTime();
                    userObj.childName = userInfo.childName;
                    userObj.LastName = userInfo.LastName;
                    userObj.Email = userInfo.Email;

                    var newToken = jwt.sign(userObj, config.get("auth.secret"), jwtOptions);

                    await new uAService().SetUserLastLogin(user.UserID);

                    return res.json({ success: true, message: "New Refreshed Token", token: newToken, userInfo: userObj, tokenExipreDate: newDate.setDate(newDate.getDate() + 7) });

                }
                else {
                    return res.json({ success: false, message: "No User Found" });
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
        logger.error(" Refresh token ", error);
        return res.send(500, {
            success: false,
            message: "Token invalid"
        });
    }
}