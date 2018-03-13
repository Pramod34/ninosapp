"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js = require("log4js");
const auth = require("../controllers/auth/authController");
const policies = require("../policies/authPolicy");
class RoutesManager {
    constructor(restify) {
        this.restify = restify;
        this.log = log4js.getLogger(this.constructor.name);
    }
    RegisterRoutes() {
        var authCheck = policies.IsAuthenticated;
        this.restify.post("/refresh-token", policies.TokenRefresh);
        var registerController = new auth.AuthController();
        this.restify.post("/register", registerController.RegisterFBOrGoogleAccount);
        this.restify.get("/check/:userId", registerController.CheckUserByUserId);
        this.restify.post("/posts", authCheck, registerController.AddPost);
        this.restify.get("/posts", registerController.GetPosts);
        this.restify.get("/posts/:postId", registerController.GetPost);
        this.restify.patch("/posts/:postId", authCheck, registerController.UpdatePost);
        this.restify.get("/profile", authCheck, registerController.GetUserProfile);
        this.restify.get("/profile/users/:userId", registerController.GetUserPublicProfile);
        this.restify.get("/profile/settings", authCheck, registerController.GetUserDetails);
        this.restify.patch("/profile/settings", authCheck, registerController.UpdateUserDetails);
        this.restify.get("/challenges", registerController.GetChallenges);
        this.restify.get("/challenges/:challengeId", registerController.GetChallenge);
        this.restify.get("/quizzes-active", authCheck, registerController.GetQuizzes);
        this.restify.get("/quizzes-completed", authCheck, registerController.GetCompletedQuizzes);
        this.restify.put("/quizzes/:quizId/start", authCheck, registerController.StartQuiz);
        this.restify.get("/quizzes/:quizId/questions", authCheck, registerController.GetQuizQuestions);
        this.restify.post("/quizzes/:quizId/evaluate", authCheck, registerController.EvaluateResult);
        this.restify.put("/quizzes/:quizId/questions/:questionId/mcq", authCheck, registerController.UpdateSolutionForQuizQuestion);
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
exports.RoutesManager = RoutesManager;

//# sourceMappingURL=routes.js.map
