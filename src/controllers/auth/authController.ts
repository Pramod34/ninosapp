import restify = require("restify");
import { BaseController } from "../../policies/baseController";
import jwt = require("jsonwebtoken");
import dbTypes = require("../../models/collections");
import { UserAuthService as uAService } from "../../services/userAuth/userAuthService";
var config = require('config');
import { VM } from "../../models/vm";

export class AuthController extends BaseController {
    private authService: uAService
    private secret: string;

    constructor() {
        super();
        this.authService = new uAService();
        this.secret = config.get("auth.secret");
    }

    public RegisterFBOrGoogleAccount = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            let user = req.body;
            if (this._.isNil(user)) {
                return res.send(500, { success: false, message: "Invalid req, no body" });
            }
            // if (this._.isNil(user.SocialSugar) || user.SocialSugar !== authConfig.socialSugar) {
            //     return res.send(500, { success: false, message: "Data not encrypted, need encryption to continue processing." });
            // }

            var userObj = await this.authService.CheckUser(user.email);

            // create a token
            var jwtOptions = <jwt.SignOptions>{};
            jwtOptions.expiresIn = "7d";
            jwtOptions.noTimestamp = false;

            if (userObj != null) {

                userObj.tokenDate = new Date().getTime();

                try {
                    if (userObj.DOB)
                        userObj.DOB = Number(userObj.DOB);
                } catch (error) {
                    this.log.warn("Wierd DOB for user " + userObj.email, userObj.DOB);
                    userObj.DOB = -2495836800000;
                }

                // if ((this._.isNil(user.GoogleId) || user.GoogleId.trim().length === 0) && (this._.isNil(user.FBId) || user.FBId.trim().length === 0)) {
                //     throw "GoogleId/FBId atleast one is required.";
                // }

                var token = jwt.sign(userObj._doc, this.secret, jwtOptions);
                await this.authService.SetUserLastLogin(userObj.userId);

                return res.json({
                    success: true,
                    message: `User - ${req.body.email} logged in.`,
                    token: token,
                    userInfo: userObj,
                    tokenExpireDate: new Date().setDate(new Date().getDate() + 7)
                });
            }

            user.isFirstLogin = true;

            var userInfo = <dbTypes.IAuth>{
                isFirstLogin: user.isFirstLogin,
                email: user.email,
                userId: user.userId,
                DOB: user.DOB,
                parentName: user.parentName,
                childName: user.childName,
                isEnabled: true
            };

            var createdUser = await this.authService.CreateUser(userInfo);

            if (createdUser) {

                // try {
                //     if (createdUser.DOB)
                //         createdUser.DOB = createdUser.DOB.toNumber();
                // } catch (error) {
                //     this.log.warn("Wierd DOB for user " + userObj.Email, userObj.DOB);
                //     createdUser.DOB = -2495836800000;
                // }

                var userDetails = <any>{
                    DOB: createdUser.DOB,
                    email: createdUser.email,
                    parentName: createdUser.parentName,
                    childName: createdUser.childName,
                    userId: createdUser.userId,
                    isFirstLogin: createdUser.isFirstLogin,
                    tokenDate: new Date().getTime(),
                };

                await this.authService.SetUserLastLogin(userDetails.userId);

                return res.send(200, {
                    success: true,
                    message: `User - ${req.body.email} logged in.`,
                    token: jwt.sign(userDetails, this.secret, jwtOptions),
                    userInfo: userDetails,
                    tokenExpireDate: new Date().setDate(new Date().getDate() + 7)
                });
            }
            else {
                return res.send(500, {
                    success: false,
                    message: "Registration Failed."
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public AddPost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userPost = <VM.IPost>req.body;
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            if (this._.isNil(userPost.type) || userPost.type.trim() === "") {
                throw `No post type sent`;
            }

            if (userPost.isChallenge === true && (this._.isNil(userPost.challengeTitle) || userPost.challengeTitle.trim() === "")) {
                throw `No challengeTitle sent`;
            }

            if (userPost.isChallenge === true && (this._.isNil(userPost.challengeId) || userPost.challengeId === "")) {
                throw `No challenge Id sent`;
            }

            userPost.userId = user.userId;

            var result = await this.authService.AddPost(userPost);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post added successfully`,
                    postInfo: result
                });
            } else {
                return res.send(200, {
                    success: true,
                    message: `Failed to add Post`
                });
            }

        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetPosts = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            let params: VM.IPostVM = req.query;

            let searchRequest = <VM.IPostVM>{
                from: Number(params.from || 0),
                size: Number(params.size || 10)
            };

            var user = this.GetUser(req);

            var result = await this.authService.GetPosts(searchRequest);

            if (!this._.isNil(result)) {
                if (!this._.isNil(user)) {

                    var finalPost = await Promise.all(result.map(async (x: any) => {
                        x = x.toObject();
                        x.myRating = await this.authService.GetUserClaps(user.userId, x._id);
                        return x;
                    }));
                    return res.send({
                        success: true,
                        message: `Posts retrived successfully`,
                        postInfo: finalPost || []
                    });
                }
                return res.send({
                    success: true,
                    message: `Posts retrived successfully`,
                    postInfo: result || []
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetPost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            if (this._.isNil(postId) || postId.trim() === "") {
                throw `No postId sent`;
            }

            var result = await this.authService.GetPost(postId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post ${postId} retrived successfully`,
                    postInfo: result
                });
            } else {
                return res.send(200, {
                    success: true,
                    message: `Failed to get Post`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UpdatePost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;
            var userUpdatePost = <VM.IPost>req.body;

            if (this._.isNil(postId) || postId.trim() === "") {
                throw `No postId sent`;
            }

            var result = await this.authService.UpdatePost(userUpdatePost, postId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post ${postId} updated successfully`,
                    postInfo: result
                });
            } else {
                return res.send(200, {
                    success: true,
                    message: `Failed to update Post`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUserProfile = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `No user authorized`;
            }

            var profile = await this.authService.GetUserProfile(user.userId);

            if (!this._.isNil(profile)) {
                return res.send(200, {
                    success: true,
                    message: `User profile retrived successfully`,
                    userProfile: profile
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get user profile`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUserPublicProfile = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = req.params.userId;

            if (this._.isNil(userId)) {
                throw `No userId sent`;
            }

            var result = await this.authService.GetUserProfile(userId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `User profile retrived successfully`,
                    userProfile: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get user profile`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUserDetails = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            var userPersonalDetails = await this.authService.GetUserDetails(user.userId);

            if (!this._.isNil(userPersonalDetails)) {
                return res.send(200, {
                    success: true,
                    message: `User personal details retrived successfully`,
                    userDetails: userPersonalDetails
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get user personal profile`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UpdateUserDetails = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            var userDataDetails = <dbTypes.IAuth>req.body;

            var userInfo = <VM.IUserInfo>{
                DOB: userDataDetails.DOB
            };

            if (!this._.isNil(userDataDetails.parentName) || userDataDetails.parentName.trim() === "") {
                userInfo.parentName = userDataDetails.parentName;
            }

            if (!this._.isNil(userDataDetails.childName) || userDataDetails.childName.trim() === "") {
                userInfo.childName = userDataDetails.childName;
            }

            if (!this._.isNil(userDataDetails.school)) {
                userInfo.school = userDataDetails.school;
            }

            if (!this._.isNil(userDataDetails.gender)) {
                userInfo.gender = userDataDetails.gender;
            }

            if (!this._.isNil(userDataDetails.city)) {
                userInfo.city = userDataDetails.city;
            }

            if (!this._.isNil(userDataDetails.state)) {
                userInfo.state = userDataDetails.state;
            }

            if (!this._.isNil(userDataDetails.aboutus)) {
                userInfo.aboutus = userDataDetails.aboutus;
            }

            var result = await this.authService.UpdateUserDetails(user.userId, userInfo);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Updated user details successfully`
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to update user details`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetQuizzes = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            var dobNumber = Number(user.DOB);

            var age = this.authService.GetUserAge(dobNumber);

            var result = await this.authService.GetQuizzes(age);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `User quizzes retrived successfully`,
                    quizeData: result
                });
            } else {
                return res.send(200, {
                    success: false,
                    message: `Failed to get user quizzes`
                });
            }

        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public StartQuiz = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var quizId = req.params.quizId;

            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            if (this._.isNil(quizId)) {
                throw `No quizId sent`;
            }

            var result = await this.authService.StartQuiz(user.userId, quizId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Quiz started successfully`
                });
            } else {
                return res.send(200, {
                    success: false,
                    message: `Failed to start user quiz`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetQuizQuestions = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var quizId = req.params.quizId;

            if (this._.isNil(quizId)) {
                throw `No quizId sent`;
            }

            var results = await this.authService.GetQuizQuestions(quizId);

            if (!this._.isNil(results)) {
                return res.send(200, {
                    success: true,
                    message: `Quiz questions retrived successfully`,
                    questions: results.questions
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get quiz questions`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UpdateSolutionForQuizQuestion = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            var quizId = req.params.quizId;
            var questionId = req.params.questionId;

            var submittedInfo = <VM.IUpdateQuizAnswer>req.body;

            if (this._.isNil(quizId) || quizId.trim() === "") {
                throw `No quizId sent`;
            }

            if (this._.isNil(questionId) || questionId.trim() === "") {
                throw `No questionId sent`;
            }

            var result = await this.authService.UpdateSolutionForQuizQuestion(user.userId, quizId, questionId, submittedInfo);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Quiz answer updated successfully`
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to update quiz answer`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    }

    public DeletePost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            var user = this.GetUser(req);

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            if (this._.isNil(user)) {
                throw `No user logged in`;
            }

            var postAuthorID = await this.authService.GetPostAuthorID(postId);

            if (!this._.isNil(postAuthorID)) {
                if (postAuthorID.userId !== user.userId) {
                    throw `Not authorized user to delete this post ${postId}`;
                }
            } else {
                throw `No post found with Id ${postId}`;
            }

            var result = await this.authService.DeletePost(postId, user.userId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post deleted successfully`
                });
            } else {
                return res.send(200, {
                    success: false,
                    message: `Failed to delete post`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public AddPostComment = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            var user = this.GetUser(req);

            var comment = req.body.comment;

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            if (this._.isNil(comment)) {
                throw `No comment sent`;
            }

            var postComment = <VM.IPostComment>{
                userId: user.userId,
                postId: postId,
                comment: comment,
                userName: user.childName
            };

            var result = await this.authService.AddPostComment(postComment);

            if (this._.isNil(result)) {
                var updatePostCommentCount = await this.authService.UpdatePostCommentCount(postId, 1);

                if (!this._.isNil(updatePostCommentCount)) {
                    return res.send(200, {
                        success: true,
                        message: `Added post comment successfully`,
                        postComment: result
                    });
                } else {
                    return res.send({
                        success: false,
                        message: `Failed to update post comment count`
                    })
                }
            } else {
                return res.send(200, {
                    success: false,
                    message: `Failed to add post comment`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UpdatePostComment = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;
            var user = this.GetUser(req);

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            var postCommentUpdate = <VM.IPostCommentUpdate>req.body;

            if (this._.isNil(postCommentUpdate.commentId) || this._.isNil(postCommentUpdate.comment) || postCommentUpdate.comment.trim() === "") {
                throw `No commentId/comment sent`;
            }

            var result = await this.authService.UpdatePostComment(postId, user.userId, postCommentUpdate);

            if (this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Updated post comment successfully`,
                    postComment: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to update post comment`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public DeletePostComment = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            var commentId = req.params.commentId;

            var user = this.GetUser(req);

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            if (this._.isNil(commentId)) {
                throw `No commentId sent`;
            }

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }
            var result = await this.authService.DeletePostComment(commentId, postId, user.userId);

            if (this._.isNil(result)) {

                var updatePostCommentCount = await this.authService.UpdatePostCommentCount(postId, -1);

                if (!this._.isNil(updatePostCommentCount)) {
                    return res.send(200, {
                        success: true,
                        message: `Deleted post comment successfully`
                    })
                } else {
                    return res.send({
                        success: false,
                        message: `Failed to update post comment count`
                    })
                }
            } else {
                return res.send({
                    success: false,
                    message: `Failed to delete post comment`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetPostComments = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            let searchRequest = <VM.IPaginate>{
                from: Number(req.query.from || 0),
                size: Number(req.query.size || 10)
            };

            var result = await this.authService.GetPostComments(postId, searchRequest);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post comment retrived successfully`,
                    postComments: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get post comments`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public AddPostClaps = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            var result = await this.authService.AddPostClaps(postId, user.userId);
            var clapsCountForPost = await this.authService.GetClapsForPostCount(postId);

            if (result) {
                await this.authService.UpdateClapsCountForPost(postId, 1);

                return res.send(200, {
                    success: true,
                    message: `Added claps for post`,
                    clapsCount: clapsCountForPost
                })
            } else {
                return res.send({
                    success: false,
                    message: `User ${user.userId} already clapped post ${postId} up.`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public RemovePostClaps = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var postId = req.params.postId;

            var user = this.GetUser(req);

            if (this._.isNil(postId)) {
                throw `No postId sent`;
            }

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            var result = await this.authService.RemovePostClaps(postId, user.userId);
            var clapsCountForPost = await this.authService.GetClapsForPostCount(postId);

            if (this._.isNil(result)) {
                await this.authService.UpdateClapsCountForPost(postId, -1);

                return res.send(200, {
                    success: true,
                    message: `Removed user claps for post`,
                    clapsCount: clapsCountForPost
                })
            } else {
                return res.send({
                    success: false,
                    message: `User ${user.userId} hasn't clapped this post ${postId}`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };
}