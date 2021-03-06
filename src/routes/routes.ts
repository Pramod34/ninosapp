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

        this.restify.post("/refresh-token", policies.TokenRefresh);

        var registerController = new auth.AuthController();

        this.restify.post("/register", registerController.RegisterFBOrGoogleAccount);

        this.restify.get("/check/:userId", registerController.CheckUserByUserId);

        this.restify.post("/posts", authCheck, registerController.AddPost);
        this.restify.get("/posts", registerController.GetPosts); // Get User Rating for post
        this.restify.get("/posts/:postId", registerController.GetPost);
        this.restify.patch("/posts/:postId", authCheck, registerController.UpdatePost);
        this.restify.get("/profile", authCheck, registerController.GetUserProfile);
        this.restify.get("/profile/users/:userId", registerController.GetUserPublicProfile)
        this.restify.get("/profile/settings", authCheck, registerController.GetUserDetails);
        this.restify.patch("/profile/settings", authCheck, registerController.UpdateUserDetails);

        this.restify.get("/challenges", registerController.GetChallenges);
        this.restify.get("/challenges/:challengeId", registerController.GetChallenge);

        this.restify.get("/quizzes-active", authCheck, registerController.GetQuizzes);
        this.restify.get("/quizzes-completed", authCheck, registerController.GetCompletedQuizzes);
        this.restify.put("/quizzes/:quizId/start", authCheck, registerController.StartQuiz);
        // get all questions in an array of quiz
        this.restify.get("/quizzes/:quizId/questions", authCheck, registerController.GetQuizQuestions);
        // click on after quiz submitted
        this.restify.post("/quizzes/:quizId/evaluate", authCheck, registerController.EvaluateResult);

        // to verify each question solution
        this.restify.put("/quizzes/:quizId/questions/:questionId/mcq", authCheck, registerController.UpdateSolutionForQuizQuestion);
        // total report card.
        this.restify.get("/quizzes/:quizId/user/:userId/evalutions", authCheck, registerController.GetUserEvaluationResult);

        this.restify.del("/posts/:postId", authCheck, registerController.DeletePost);

        this.restify.post("/posts/:postId/comments", authCheck, registerController.AddPostComment);
        this.restify.get("/posts/:postId/comments", authCheck, registerController.GetPostComments);
        this.restify.del("/posts/:postId/comments/:commentId", authCheck, registerController.DeletePostComment);
        this.restify.patch("/posts/:postId/comments", authCheck, registerController.UpdatePostComment);

        this.restify.put("/posts/:postId/claps", authCheck, registerController.AddPostClaps);
        this.restify.del("/posts/:postId/claps", authCheck, registerController.RemovePostClaps);

        this.restify.get("/users", authCheck, registerController.GetUsers);
        this.restify.get("/search-posts", authCheck, registerController.SearchPosts);
        this.restify.get("/search-challenge", authCheck, registerController.SearchChallenge);

        this.restify.post("/report-post", authCheck, registerController.UserReportOnPost);

        this.restify.put("/follow/:followingId", authCheck, registerController.FollowUser);
        this.restify.del("/follow/:followingId", authCheck, registerController.UnFollowUser);
        this.restify.get("/following-users", authCheck, registerController.GetFollowing);
        this.restify.get("/followers-users", authCheck, registerController.GetFollowers);

        this.restify.get("/notifications", authCheck, registerController.GetNotifications);
        this.restify.get("/notifications-count", authCheck, registerController.GetUnreadNotificationsCount);
        this.restify.put("/notifications/:notificationId/mark", authCheck, registerController.MarkNotificationAsRead);
        this.restify.patch("/notifications/mark-all", authCheck, registerController.MarkAllNotificationsAsRead);

        this.log.info("Routes Register Complete ✔");
    }
}