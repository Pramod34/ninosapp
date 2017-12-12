"use strict";

import { Server } from "restify";
import log4js = require("log4js");
import auth = require("../controllers/auth/authController");
import policies = require("../policies/authPolicy");

export class RoutesManager {
    private log: log4js.Logger;
    constructor(private restify: Server) {
        this.log = log4js.getLogger(this.constructor.name);
    }

    public RegisterRoutes(): void {

        var authCheck = policies.IsAuthenticated;

        var registerController = new auth.AuthController();

        this.restify.post("/register", registerController.RegisterFBOrGoogleAccount);
        this.restify.post("/posts", authCheck, registerController.AddPost);
        this.restify.get("/posts", registerController.GetPosts); // Get User Rating for post
        this.restify.get("/posts/:postId", registerController.GetPost);
        this.restify.patch("/posts/:postId", authCheck, registerController.UpdatePost);
        this.restify.get("/profile", authCheck, registerController.GetUserProfile);
        this.restify.get("/profile/users/:userId", registerController.GetUserPublicProfile)
        this.restify.get("/profile/settings", authCheck, registerController.GetUserDetails);
        this.restify.patch("/profile/settings", authCheck, registerController.UpdateUserDetails);

        this.restify.get("/quizzes", authCheck, registerController.GetQuizzes);
        this.restify.put("/quizzes/:quizId/start", authCheck, registerController.StartQuiz)
        this.restify.get("/quizzes/:quizId/questions", authCheck, registerController.GetQuizQuestions);

        this.restify.put("/quizzes/:quizId/questions/:questionId/mcq", authCheck, registerController.UpdateSolutionForQuizQuestion);
        // this.restify.get("/quizzes/:quizId/user/:userId/evalutions", authCheck, registerController.evalutionUsersQuiz);

        this.restify.del("/posts/:postId", authCheck, registerController.DeletePost);

        this.restify.post("/posts/:postId/comments", authCheck, registerController.AddPostComment);
        this.restify.get("/posts/:postId/comments", authCheck, registerController.GetPostComments);
        this.restify.del("/posts/:postId/comments/:commentId", authCheck, registerController.DeletePostComment);
        this.restify.patch("/posts/:postId/comments", authCheck, registerController.UpdatePostComment);

        this.restify.put("/posts/:postId/claps", authCheck, registerController.AddPostClaps);
        this.restify.del("/posts/:postId/claps", authCheck, registerController.RemovePostClaps);

        this.log.info("Routes Register Complete ✔");
    }
}