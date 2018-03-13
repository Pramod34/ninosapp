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
const jwt = require("jsonwebtoken");
var config = require('config');
const app_1 = require("../app");
const mdb_1 = require("../models/mdb");
const userAuthService_1 = require("../services/userAuth/userAuthService");
function IsAuthenticated(req, res, next) {
    try {
        var token = req.headers["x-access-token"] || req.params.token;
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }
        if (token) {
            jwt.verify(token, config.get("auth.secret"), function (err, decoded) {
                if (err) {
                    if (err.message && err.message === "jwt expired") {
                        return res.json({ success: false, message: "Token expired." });
                    }
                    return res.json({ success: false, message: "Failed to authenticate token." });
                }
                else {
                    next();
                }
            });
        }
        else {
            return res.send(403, {
                success: false,
                message: "No token provided."
            });
        }
    }
    catch (error) {
        app_1.logger.error("IsAuthenticate", error, token);
        return res.send(403, {
            success: false,
            message: "No token provided."
        });
    }
}
exports.IsAuthenticated = IsAuthenticated;
function TokenRefresh(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var user;
        try {
            var token = req.headers["x-access-token"] || req.params.token;
            if (!token && req.body && req.body.token) {
                token = req.body.token;
            }
            if (token) {
                jwt.verify(token, config.get("auth.secret"), (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        if (err.message !== "jwt expired") {
                            return res.json({ success: false, message: err.message });
                        }
                        user = jwt.decode(token);
                    }
                    else {
                        user = decoded;
                    }
                    var jwtOptions = {};
                    jwtOptions.noTimestamp = false;
                    var query = yield mdb_1.mdbModels.Auth.findOne({ userId: user.userId }).exec();
                    if (query) {
                        var userInfo = query._doc;
                        var newDate = new Date();
                        var userObj = user;
                        if (userObj.exp) {
                            delete userObj.exp;
                        }
                        if (!userObj.exp)
                            jwtOptions.expiresIn = "7d";
                        userObj.tokenDate = newDate.getTime();
                        userObj.childName = userInfo.childName;
                        var newToken = jwt.sign(userObj, config.get("auth.secret"), jwtOptions);
                        yield new userAuthService_1.UserAuthService().SetUserLastLogin(user.UserID);
                        return res.json({ success: true, message: "New Refreshed Token", token: newToken, userInfo: userObj, tokenExipreDate: newDate.setDate(newDate.getDate() + 7) });
                    }
                    else {
                        return res.json({ success: false, message: "No User Found" });
                    }
                }));
            }
            else {
                return res.send(403, {
                    success: false,
                    message: "No token provided."
                });
            }
        }
        catch (error) {
            app_1.logger.error(" Refresh token ", error);
            return res.send(500, {
                success: false,
                message: "Token invalid"
            });
        }
    });
}
exports.TokenRefresh = TokenRefresh;

//# sourceMappingURL=authPolicy.js.map
