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

            var userObj = await this.authService.CheckUser(user.userId);

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
                    this.log.warn("Wierd DOB for user " + userObj.userId, userObj.DOB);
                    userObj.DOB = -2495836800000;
                }

                // if ((this._.isNil(user.GoogleId) || user.GoogleId.trim().length === 0) && (this._.isNil(user.FBId) || user.FBId.trim().length === 0)) {
                //     throw "GoogleId/FBId atleast one is required.";
                // }

                var token = jwt.sign(userObj._doc, this.secret, jwtOptions);
                await this.authService.SetUserLastLogin(userObj.userId);

                return res.send({
                    success: true,
                    message: `User - ${req.body.userId} logged in.`,
                    token: token,
                    userInfo: userObj,
                    tokenExpireDate: new Date().setDate(new Date().getDate() + 7)
                });
            }

            user.isFirstLogin = true;

            var userInfo = <dbTypes.IAuth>{
                isFirstLogin: user.isFirstLogin,
                userId: user.userId,
                DOB: user.DOB,
                parentName: user.parentName,
                childName: user.childName,
                isEnabled: true
            };

            if (!this._.isNil(user.email)) {
                userInfo.email = user.email;
            }

            if (!this._.isNil(user.phoneNo)) {
                userInfo.phoneNo = user.phoneNo;
            }

            var createdUser = await this.authService.CreateUser(userInfo);

            if (createdUser) {

                var userDetails = <any>{
                    DOB: createdUser.DOB,
                    parentName: createdUser.parentName,
                    childName: createdUser.childName,
                    userId: createdUser.userId,
                    isFirstLogin: createdUser.isFirstLogin,
                    tokenDate: new Date().getTime(),
                };

                if (!this._.isNil(createdUser.email)) {
                    userDetails.email = createdUser.email;
                }

                if (!this._.isNil(createdUser.phoneNo)) {
                    userDetails.phoneNo = createdUser.phoneNo;
                }

                var neo4jUser = await this.authService.CreateNeoUser(userDetails);

                if (neo4jUser) {
                    console.log("Neo User created successfully");
                } else {
                    throw `Neo4J user failed to create`;
                }

                await this.authService.SetUserLastLogin(userDetails.userId);

                return res.send(200, {
                    success: true,
                    message: `User - ${req.body.userId} logged in.`,
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

    public CheckUserByUserId = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = req.params.userId;

            if (this._.isNil(userId)) {
                throw `No userId sent.`;
            }

            var result = await this.authService.CheckUser(userId);

            if (!this._.isNil(result)) {

                var jwtOptions = <jwt.SignOptions>{};
                jwtOptions.expiresIn = "7d";
                jwtOptions.noTimestamp = false;

                var userInfo = result._doc;

                delete userInfo.isEnabled;

                if (!this._.isNil(userInfo.school))
                    delete userInfo.school;

                if (!this._.isNil(userInfo.gender))
                    delete userInfo.gender;

                if (!this._.isNil(userInfo.city))
                    delete userInfo.city;

                if (!this._.isNil(userInfo.aboutus))
                    delete userInfo.aboutus;

                if (!this._.isNil(userInfo.createdAt))
                    delete userInfo.createdAt;

                if (!this._.isNil(userInfo.updatedAt))
                    delete userInfo.updatedAt;



                userInfo.tokenDate = new Date().getTime();

                try {
                    if (userInfo.DOB)
                        userInfo.DOB = Number(userInfo.DOB);
                } catch (error) {
                    this.log.warn("Wierd DOB for user " + userInfo.userId, userInfo.DOB);
                    userInfo.DOB = -2495836800000;
                }

                var token = jwt.sign(userInfo, this.secret, jwtOptions);

                return res.send({
                    success: true,
                    message: `User - ${userInfo.userId} logged in.`,
                    token: token,
                    userInfo: userInfo,
                    tokenExpireDate: new Date().setDate(new Date().getDate() + 7)
                });
            } else {
                return res.send({
                    success: false,
                    message: `No user ${userId} found with Id`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    }

    public AddPost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userPost = <VM.IPost>req.body;
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            if (!this._.isNil(userPost.type)) {
                userPost.type = "post";
            }

            var result = await this.authService.AddPost(userPost);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post added successfully`,
                    postInfo: result
                });
            } else {
                return res.send({
                    success: false,
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
                from: Number(req.params.from || 0),
                size: Number(req.params.size || 10)
            };

            if (!this._.isNil(params.type) && params.type === "challenge") {
                searchRequest.type = params.type;
                if (!this._.isNil(params.challengeId)) {
                    searchRequest.challengeId = params.challengeId;
                } else {
                    throw `No challengeId sent`;
                }
            }

            if (!this._.isNil(params.userId)) {
                searchRequest.userId = params.userId;
            }

            var user = this.GetUser(req);

            var currentUserId;

            if (!this._.isNil(user)) {
                currentUserId = user.userId;
            }

            var result = await this.authService.GetPosts(searchRequest, currentUserId);

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

            var user = this.GetUser(req);

            var userId;

            if (!this._.isNil(user)) {
                userId = user.userId;
            }

            var result = await this.authService.GetPost(postId);

            if (!this._.isNil(result)) {

                if (!this._.isNil(userId)) {
                    result._doc.myRating = await this.authService.GetUserClaps(userId, result._id);
                } else {
                    result._doc.myRating = false;
                }

                return res.send(200, {
                    success: true,
                    message: `Post ${postId} retrived successfully`,
                    postInfo: result
                });
            } else {
                return res.send({
                    success: false,
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

            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            if (this._.isNil(postId) || postId.trim() === "") {
                throw `No postId sent`;
            }

            if (this._.isNil(userUpdatePost.type) || userUpdatePost.type.trim() === "") {
                throw `No post type sent`;
            }

            if (userUpdatePost.isChallenge === true && (this._.isNil(userUpdatePost.challengeTitle) || userUpdatePost.challengeTitle.trim() === "")) {
                throw `No challengeTitle sent`;
            }

            if (userUpdatePost.isChallenge === true && (this._.isNil(userUpdatePost.challengeId) || userUpdatePost.challengeId === "")) {
                throw `No challenge Id sent`;
            }

            userUpdatePost.userId = user.userId;
            userUpdatePost.userName = user.childName;

            var result = await this.authService.UpdatePost(userUpdatePost, postId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Post ${postId} updated successfully`,
                    postInfo: result
                });
            } else {
                return res.send({
                    success: false,
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

            var profile = await this.authService.GetUserProfile(user.userId, undefined);

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
            var publicUserId = req.params.userId;

            if (this._.isNil(publicUserId)) {
                throw `No userId sent`;
            }

            var user = this.GetUser(req);
            var userId;

            if (!this._.isNil(user)) {
                userId = user.userId;
            }

            var result = await this.authService.GetUserProfile(publicUserId, userId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `User profile retrived successfully`,
                    userProfile: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get user public profile`
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
                var response = await this.authService.UpdateUserName(user.userId, userInfo.childName);
                if (response) {
                    return res.send(200, {
                        success: true,
                        message: `Updated user details successfully`
                    });
                } else {
                    return res.send(200, {
                        success: false,
                        message: `Failed to update user details in neo4j`
                    });
                }
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

    public GetCompletedQuizzes = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            let searchRequest = <VM.IQuizzesVM>{
                from: Number(req.params.from || 0),
                size: Number(req.params.size || 10),
                userId: user.userId
            };

            var dobNumber = Number(user.DOB);

            var age = this.authService.GetUserAge(dobNumber);
            searchRequest.age = age;

            var result = await this.authService.GetCompletedQuizzes(searchRequest);

            if (!this._.isNil(result)) {
                if (!this._.isNil(user)) {

                    var finalQuizResults = result.map(x => {
                        x = x.toObject();
                        x.isQuizTaken = true;
                        return x;
                    });

                    return res.send({
                        success: true,
                        message: `User completed quizzes retrived successfully`,
                        quizeData: finalQuizResults || []
                    });
                }
                return res.send(200, {
                    success: true,
                    message: `User completed quizzes retrived successfully`,
                    quizeData: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get user completed quizzes`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    }

    public GetQuizzes = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `Not authorized user`;
            }

            let searchRequest = <VM.IQuizzesVM>{
                from: Number(req.params.from || 0),
                size: Number(req.params.size || 10),
                userId: user.userId
            };

            var dobNumber = Number(user.DOB);

            var age = this.authService.GetUserAge(dobNumber);
            searchRequest.age = age;

            var result = await this.authService.GetQuizzes(searchRequest);

            if (!this._.isNil(result)) {
                if (!this._.isNil(user)) {

                    var finalQuizResults = result.map(x => {
                        x = x.toObject();
                        x.isQuizTaken = false;
                        return x;
                    });
                    return res.send({
                        success: true,
                        message: `User quizzes retrived successfully`,
                        quizeData: finalQuizResults || []
                    });
                }
                return res.send(200, {
                    success: true,
                    message: `User quizzes retrived successfully`,
                    quizeData: result
                });
            } else {
                return res.send({
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

            console.log(result);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Quiz started successfully`,
                    quizStarted: result
                });
            } else {
                return res.send({
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

                var question = results._doc.questions;

                return res.send(200, {
                    success: true,
                    message: `Quiz questions retrived successfully`,
                    questions: question
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
    };

    public EvaluateResult = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            var evaluateResultDetails = <VM.IEvaluateResultParams>req.body;

            var quizId = req.params.quizId;

            if (this._.isNil(user)) {
                throw `User not logged in`;
            }

            if (this._.isNil(quizId)) {
                throw `No quizId sent`;
            }

            if (this._.isNil(evaluateResultDetails.evalutionId)) {
                throw `No evaluationId sent`;
            }

            var result = await this.authService.EvaluateQuizResult(user.userId, quizId, evaluateResultDetails);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `User quiz evaluate successfully`,
                    evaluateInfo: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to evaluate user quiz`
                });
            }

        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUserEvaluationResult = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = req.params.userId;
            var quizId = req.params.quizId;

            if (this._.isNil(userId) || this._.isNil(quizId)) {
                throw `No userId and quizId sent`;
            }

            var result = await this.authService.GetUserEvaluationResult(userId, quizId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Fetched user evaluation result successfully`,
                    evaluateResult: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to fetch evaluation result`
                });
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
                return res.send({
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

            if (!this._.isNil(result)) {
                var updatePostCommentCount = await this.authService.UpdatePostCommentCount(postId, 1);

                var notification = <VM.INotifications>{
                    postComment: <VM.IPostCommentNotification>{
                        postId: postId,
                        postTitle: updatePostCommentCount.title,
                        commentId: result._id
                    },
                    type: VM.userNotificationType.POST_COMMENT,
                    toUserId: updatePostCommentCount.userId,
                    fromUserId: user.userId,
                    fromUserName: user.childName
                };

                await this.authService.AddNotification(notification);

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
                return res.send({
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

            if (!this._.isNil(result)) {
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

            if (!this._.isNil(result)) {

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

            var userId = this.GetUser(req).userId;

            var result = await this.authService.GetPostComments(postId, searchRequest, userId);

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
                var postDetails = await this.authService.UpdateClapsCountForPost(postId, 1);

                var notification = <VM.INotifications>{
                    postClaps: <VM.IPostClapsNotification>{
                        postId: postId,
                        postTitle: postDetails.title
                    },
                    type: VM.userNotificationType.POST_CLAPS,
                    toUserId: postDetails.userId,
                    fromUserId: user.userId,
                    fromUserName: user.childName
                };

                await this.authService.AddNotification(notification);

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

            if (!this._.isNil(result)) {
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

    public GetChallenges = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var params = req.params;

            let paginate = <VM.IPaginate>{
                from: Number(params.from || 0),
                size: Number(params.size || 10)
            };

            var result = await this.authService.GetChallenges(paginate);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Challenges retrived successfully`,
                    challenges: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get challenges`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetChallenge = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var challengeId = req.params.challengeId;

            if (this._.isNil(challengeId)) {
                throw `No challengeId sent`;
            }

            var result = await this.authService.GetChallenge(challengeId);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Challenge ${challengeId} retrived successfully`,
                    challengeInfo: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get challenge`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUsers = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            var searchUserInfo = <VM.ISearchUser>req.query;

            if (this._.isNil(searchUserInfo.userName)) {
                throw `No userName sent.`;
            }

            let searchUserObj = <VM.ISearchUser>{
                from: Number(searchUserInfo.from || 0),
                size: Number(searchUserInfo.size || 10),
                userName: searchUserInfo.userName
            };

            var result = await this.authService.GetUsers(searchUserObj);

            if (!this._.isNil(result)) {
                if (!this._.isNil(user)) {

                    var finalUsersResults = await Promise.all(result.map(async (x: any) => {
                        x = x.toObject();
                        x.isFollowing = await this.authService.IsFollowingUser(user.userId, x.userId);
                        return x;
                    }));
                    return res.send({
                        success: true,
                        message: `Users retrived successfully`,
                        users: finalUsersResults || []
                    });
                }
                return res.send(200, {
                    success: true,
                    message: `Users retrived successfully`,
                    users: result
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get users`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public SearchPosts = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var searchPostInfo = <VM.ISearch>req.query;

            if (this._.isNil(searchPostInfo.keyword)) {
                throw `No keyword sent.`;
            }

            let searchUserObj = <VM.ISearch>{
                from: Number(searchPostInfo.from || 0),
                size: Number(searchPostInfo.size || 10),
                keyword: searchPostInfo.keyword
            };

            var result = await this.authService.SearchPosts(searchUserObj);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Posts retrived successfully`,
                    postsInfo: result || []
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get posts`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    }

    public SearchChallenge = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var searchChallengeInfo = <VM.ISearch>req.query;

            if (this._.isNil(searchChallengeInfo.keyword)) {
                throw `No keyword sent.`;
            }

            let searchUserObj = <VM.ISearch>{
                from: Number(searchChallengeInfo.from || 0),
                size: Number(searchChallengeInfo.size || 10),
                keyword: searchChallengeInfo.keyword
            };

            var result = await this.authService.SearchChallenge(searchUserObj);

            if (!this._.isNil(result)) {
                return res.send(200, {
                    success: true,
                    message: `Challenges retrived successfully`,
                    challenges: result || []
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to get Challenges`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    }

    public UserReportOnPost = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = this.GetUser(req).userId;

            if (this._.isNil(userId)) {
                throw `User not logged in.`;
            }

            var reportDetails = <VM.IUserPostReport>req.body;

            if (this._.isNil(reportDetails.postId) || this._.isNil(reportDetails.userReport)) {
                throw `No postId/userReport is sent.`;
            }

            var result = await this.authService.UserReportOnPost(userId, reportDetails);

            if (result) {
                return res.send({
                    success: true,
                    message: `Added user report on post successfully`
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to add user report on post`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UserReportOnPostComment = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = this.GetUser(req).userId;

            if (this._.isNil(userId)) {
                throw `User not logged in.`;
            }

            var reportDetails = <VM.IUserPostCommentReport>req.body;

            if (this._.isNil(reportDetails.postId) || this._.isNil(reportDetails.commentId) || this._.isNil(reportDetails.userReport)) {
                throw `No postId/commentId/userReport is sent.`;
            }

            var result = await this.authService.UserReportOnPostComment(userId, reportDetails);

            if (result) {
                return res.send({
                    success: true,
                    message: `Added user report on post comment successfully`
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to add user report on post comment`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public FollowUser = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);
            var userId = user.userId;
            var userIDToFollow = req.params.followingId;

            if (userId === userIDToFollow) {
                throw `Can't follow yourself. UserId - ${userIDToFollow}.`;
            }

            var resp = await this.authService.FollowUser(userId, userIDToFollow);

            if (resp) {

                var notification = <VM.INotifications>{
                    userFollowing: <VM.IUserFollowingNotification>{
                        fromUserId: user.userId,
                        fromUserName: user.childName
                    },
                    type: VM.userNotificationType.USER_FOLLOWING,
                    toUserId: userIDToFollow,
                    fromUserId: user.userId,
                    fromUserName: user.childName
                };

                await this.authService.AddNotification(notification);

                return res.send({
                    success: true,
                    message: `User(${userId}) now follows user(${userIDToFollow}).`,
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to follow user(${userIDToFollow}).`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public UnFollowUser = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);
            var userId = user.userId;
            var userIdToUnFollow = req.params.followingId;

            if (userId === userIdToUnFollow) {
                throw `Can't Unfollow yourself. UserId - ${userIdToUnFollow}.`;
            }

            var resp = await this.authService.UnFollowUser(userId, userIdToUnFollow);

            if (resp) {
                return res.send({
                    success: true,
                    message: `User(${userId}) Unfollowed user(${userIdToUnFollow}).`,
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to unfollow user(${userIdToUnFollow}).`
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetFollowing = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `No user logged in`;
            }

            var result = await this.authService.GetFollowing(user.userId);

            if (!this._.isNil(result) && result.length > 0) {
                return res.send({
                    success: true,
                    message: `Following details retrived successfully`,
                    followingList: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to retrive following details`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetFollowers = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `No user logged in`;
            }

            var result = await this.authService.GetFollowers(user.userId);

            if (!this._.isNil(result) && result.length > 0) {
                var finalFollowersResults = await Promise.all(result.map(async (x: any) => {
                    x.isFollowing = await this.authService.IsFollowingUser(user.userId, x.userId);
                    return x;
                }));
                return res.send({
                    success: true,
                    message: `Followers details retrived successfully`,
                    followingList: finalFollowersResults || []
                });
            } else {
                res.send({
                    success: false,
                    message: `Failed to retrive followers details`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetNotifications = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var user = this.GetUser(req);

            if (this._.isNil(user)) {
                throw `user logged not in`;
            }

            var from = Number(req.params.from || 0);
            var size = Number(req.params.size || 10);

            var result = await this.authService.GetNotifications(user.userId, from, size);

            if (!this._.isNil(result)) {
                return res.send({
                    success: true,
                    message: `Notifications retrived successfully`,
                    notifications: result
                })
            } else {
                return res.send({
                    success: false,
                    message: `Failed to fetch notifications`
                })
            }

        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public GetUnreadNotificationsCount = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = this.GetUser(req).userId;

            if (this._.isNil(userId)) {
                throw `user logged not in`;
            }

            var notificationsCount = await this.authService.GetUnReadNotificationsCount(userId);

            if (!this._.isNil(notificationsCount)) {
                return res.send({
                    success: true,
                    message: "Fetched the user notifications count.",
                    notificationsCount: this._.isNil(notificationsCount) ? 0 : Number(notificationsCount)
                });
            } else {
                return res.send({
                    success: false,
                    message: `Failed to unread notification count`
                })
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public MarkNotificationAsRead = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = this.GetUser(req).userId;

            if (this._.isNil(userId)) {
                throw `user logged not in`;
            }

            var notificationId = req.params.notificationId;

            if (this._.isNil(notificationId)) {
                throw `NotificationId not sent`;
            }

            var result = await this.authService.MarkNotificationsAsRead(userId, notificationId);

            if (!this._.isNil(result)) {
                return res.send({
                    success: true,
                    message: "Marked as read successfully."
                });
            } else {
                return res.send({
                    success: false,
                    message: "Failed to mark as read, Either you are not authorised to read the content or Invalid data sent."
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };

    public MarkAllNotificationsAsRead = async (req: restify.Request, res: restify.Response, next: restify.Next): Promise<any> => {
        try {
            var userId = this.GetUser(req).userId;

            if (this._.isNil(userId)) {
                throw `user logged not in`;
            }

            var result = await this.authService.MarkAllNotificationsAsRead(userId);

            if (!this._.isNil(result)) {
                return res.send({
                    success: true,
                    message: "Marked All as read successfully."
                });
            } else {
                return res.send({
                    success: false,
                    message: "Failed to mark all as read, Either you are not authorised to read the content or Invalid data sent."
                });
            }
        } catch (error) {
            this.ErrorResult(error, req, res, next);
        }
    };
}