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
const mdb_1 = require("../../models/mdb");
const baseService_1 = require("../../policies/baseService");
const redisFactory_1 = require("../../factories/redisFactory");
const vm_1 = require("../../models/vm");
const neo4jFactory_1 = require("../../factories/neo4jFactory");
class UserAuthService extends baseService_1.BaseService {
    constructor() {
        super();
        this.CheckUser = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._.isNil(userId)) {
                    throw `No userId sent.`;
                }
                this.log.info(userId + " Check User");
                var userQuery = yield mdb_1.mdbModels.Auth.findOne({ userId: userId }).exec();
                return userQuery;
            }
            catch (error) {
                this.log.error("Check CheckUser", error);
                throw error;
            }
        });
        this.CreateUser = (userInfo) => __awaiter(this, void 0, void 0, function* () {
            try {
                var createUser = yield mdb_1.mdbModels.Auth.create(userInfo);
                return createUser;
            }
            catch (error) {
                this.log.error("Create User", error);
                throw error;
            }
        });
        this.SetUserLastLogin = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                this.log.info(`userInfo: ${userId}`);
                var key = `${this.usersLastLogin}`;
                var resp = yield this.rF.redisClient.zaddAsync(key, new Date().getTime(), userId);
                return resp;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.AddPost = (userPost) => __awaiter(this, void 0, void 0, function* () {
            try {
                var addPostQuery = yield mdb_1.mdbModels.Post.create(userPost);
                return addPostQuery;
            }
            catch (error) {
                throw error;
            }
        });
        this.AddUserPoints = (type, userId, sourceId, points) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                this.log.info(`userInfo: ${userId}`);
                var key = `${this.userPoints}:${userId}`;
                var resp = yield this.rF.redisClient.hincrbyAsync(key, "points", points);
                var pointsLog = {
                    type: type,
                    userId: userId,
                    sourceId: sourceId,
                    points: points
                };
                yield mdb_1.mdbModels.PointsLog.create(pointsLog);
                return resp;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.DeleteUserPoints = (type, userId, sourceId, points) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                this.log.info(`userInfo: ${userId}`);
                var key = `${this.userPoints}:${userId}`;
                var resp = yield this.rF.redisClient.hincrbyAsync(key, "points", -points);
                var pointsLog = {
                    type: type,
                    userId: userId,
                    sourceId: sourceId,
                    points: -points
                };
                yield mdb_1.mdbModels.PointsLog.create(pointsLog);
                return resp;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetPosts = (searchRequest, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var criteria = { userId: { $exists: true } };
                if (!this._.isNil(searchRequest.type)) {
                    criteria.type = searchRequest.type;
                }
                if (!this._.isNil(searchRequest.challengeId)) {
                    criteria.challengeId = searchRequest.challengeId;
                }
                if (!this._.isNil(searchRequest.userId)) {
                    criteria.userId = searchRequest.userId;
                }
                var userReportedPostIds = yield this.GetUserReportedPosts(userId);
                if (!this._.isNil(userReportedPostIds) && userReportedPostIds.length > 0) {
                    criteria._id = { $nin: userReportedPostIds };
                }
                var results = yield mdb_1.mdbModels.Post.find(criteria)
                    .skip(searchRequest.from)
                    .limit(searchRequest.size)
                    .sort({ "createdAt": -1 })
                    .exec();
                return results;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetPost = (postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var postResult = yield mdb_1.mdbModels.Post.findOne({ _id: postId }).exec();
                return postResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdatePost = (updatePostDetails, postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.Post.findOneAndUpdate({ _id: postId }, { $set: updatePostDetails }, { upsert: true, new: true }).exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetUserProfile = (userId, userId2) => __awaiter(this, void 0, void 0, function* () {
            try {
                var userProfile = {};
                var userDetails = yield mdb_1.mdbModels.Auth.findOne({ userId: userId }).select("childName city aboutus").exec();
                if (!this._.isNil(userDetails)) {
                    var usersPostCount = yield mdb_1.mdbModels.Post.count({ userId: userId }).exec();
                    var isFollowing = false;
                    if (!this._.isNil(userId2)) {
                        isFollowing = yield this.IsFollowingUser(userId2, userId);
                    }
                    var followersAndFollowingCount = yield this.GetFollowerOrFollowingCount(userId);
                    userProfile.childName = userDetails.childName;
                    userProfile.userId = userId;
                    userProfile.aboutYou = userDetails.aboutus;
                    userProfile.postCount = usersPostCount;
                    userProfile.followersCount = followersAndFollowingCount.followersCount;
                    userProfile.followingCount = followersAndFollowingCount.followingsCount;
                    userProfile.isFollowing = isFollowing;
                    yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                    var keyUser = `${this.userPoints}:${userId}`;
                    var points = yield this.rF.redisClient.hgetAsync(keyUser, "points");
                    userProfile.userPoints = this._.isNil(points) ? 0 : Number(points);
                    if (!this._.isNil(userDetails.city)) {
                        userProfile.city = userDetails.city;
                    }
                }
                return userProfile;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetFollowerOrFollowingCount = (userId) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                var followingsCount = 0;
                var followersCount = 0;
                var params = {
                    userId: userId
                };
                session = neo4jFactory_1.driver.session();
                var followingQuery = `MATCH (n:User{UserID:{userId}})-[r:Follows]->() RETURN count(r)`;
                var followingResp = yield session.run(followingQuery, params);
                if (followingResp.records.length > 0) {
                    followingsCount = followingResp.records[0]._fields[0].toNumber();
                }
                var followersQuery = `MATCH (n:User{UserID:{userId}})<-[r:Follows]-() RETURN count(r)`;
                var followersResp = yield session.run(followersQuery, params);
                if (followersResp.records.length > 0) {
                    followersCount = followersResp.records[0]._fields[0].toNumber();
                }
                session.close();
                return {
                    followingsCount: followingsCount,
                    followersCount: followersCount
                };
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.GetUserDetails = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.Auth.findOne({ userId: userId }).exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdateUserDetails = (userId, userInfo) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.Auth.findOneAndUpdate({ userId: userId }, { $set: userInfo }, { upsert: true }).exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdateUserName = (userId, childName) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                yield mdb_1.mdbModels.Post.update({ userId: userId }, { userName: childName }, { multi: true, upsert: true }).exec();
                yield mdb_1.mdbModels.PostComments.update({ userId: userId }, { userName: childName }, { upsert: true, multi: true }).exec();
                yield mdb_1.mdbModels.Notifications.update({ fromUserId: userId }, { fromUserName: childName }, { upsert: true, multi: true }).exec();
                var params = {
                    userId: userId,
                    childName: childName
                };
                var neoQuery = `MATCH (n:User) WHERE n.UserID = {userId} SET n.ChildName = {childName} RETURN n`;
                session = neo4jFactory_1.driver.session();
                var queryResult = yield session.run(neoQuery, params);
                session.close();
                if (this._.isNil(queryResult)) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.GetUserAge = (dob) => {
            try {
                var today = new Date();
                var birthDate = new Date(dob);
                var age = today.getFullYear() - birthDate.getFullYear();
                var m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                return age;
            }
            catch (error) {
                throw error;
            }
        };
        this.GetQuizzes = (searchRequest) => __awaiter(this, void 0, void 0, function* () {
            try {
                var ageGroup;
                if (searchRequest.age < 7) {
                    ageGroup = "3-7";
                }
                else if (searchRequest.age >= 7 && searchRequest.age < 11) {
                    ageGroup = "7-11";
                }
                else if (searchRequest.age >= 11 && searchRequest.age <= 16) {
                    ageGroup = "11-16";
                }
                var completedQuizIds = yield this.GetUserCompletedQuizIds(searchRequest.userId, searchRequest.from, searchRequest.size);
                var queryResult = yield mdb_1.mdbModels.Quizzes.find({ agegroup: ageGroup, _id: { $nin: completedQuizIds } })
                    .select("title duration agegroup")
                    .skip(searchRequest.from)
                    .limit(searchRequest.size)
                    .exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetCompletedQuizzes = (searchRequest) => __awaiter(this, void 0, void 0, function* () {
            try {
                var ageGroup;
                if (searchRequest.age < 7) {
                    ageGroup = "3-7";
                }
                else if (searchRequest.age >= 7 && searchRequest.age < 11) {
                    ageGroup = "7-11";
                }
                else if (searchRequest.age >= 11 && searchRequest.age <= 16) {
                    ageGroup = "11-16";
                }
                var completedQuizIds = yield this.GetUserCompletedQuizIds(searchRequest.userId, searchRequest.from, searchRequest.size);
                var queryResult = yield mdb_1.mdbModels.Quizzes.find({ agegroup: ageGroup, _id: { $in: completedQuizIds } }).select("title duration agegroup")
                    .skip(searchRequest.from)
                    .limit(searchRequest.size)
                    .exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetUserCompletedQuizIds = (userId, from, size) => __awaiter(this, void 0, void 0, function* () {
            try {
                var query = yield mdb_1.mdbModels.Evalution.find({ userId: userId })
                    .select("quizId")
                    .exec();
                var quizIds = [];
                query.forEach(x => {
                    quizIds.push(x.quizId);
                });
                return quizIds;
            }
            catch (error) {
                throw error;
            }
        });
        this.StartQuiz = (userId, quizId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var startedQuiz = yield mdb_1.mdbModels.Evalution.findOne({ completedDate: { $exists: false }, userId: userId, quizId: quizId }).exec();
                if (!this._.isNil(startedQuiz)) {
                    throw `You have not completed the quiz ${quizId}`;
                }
                var quiz = yield mdb_1.mdbModels.Quizzes.findOne({ _id: quizId }).exec();
                if (this._.isNil(quiz)) {
                    throw `No quiz found with id ${quiz}`;
                }
                var totalScore = quiz.questions.length * 2;
                var evalution = {
                    userId: userId,
                    quizId: quizId,
                    totalScore: totalScore,
                    acquiredScore: 0,
                    completedDate: new Date()
                };
                var evalutionReport = yield mdb_1.mdbModels.Evalution.create(evalution);
                return evalutionReport;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetQuizQuestions = (quizId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.Quizzes.findOne({ _id: quizId }).select("questions").exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdateSolutionForQuizQuestion = (userId, quizId, questionId, submittedInfo) => __awaiter(this, void 0, void 0, function* () {
            try {
                var quizQuestionStatus = "incorrect";
                var quizQuestions = yield mdb_1.mdbModels.Quizzes.findOne({ _id: quizId, questions: { $elemMatch: { _id: questionId } } }).select("questions._id questions.solution").exec();
                if (!this._.isNil(quizQuestions)) {
                    var questions = quizQuestions.questions;
                    var solution;
                    questions.forEach(x => {
                        if (x._id.toHexString() === questionId)
                            solution = x.solution;
                    });
                    var obj = {};
                    if (!this._.isNil(submittedInfo.answer)) {
                        if (solution === submittedInfo.answer) {
                            quizQuestionStatus = "correct";
                            obj = {
                                "mcqSolution.$.status": quizQuestionStatus,
                                "mcqSolution.$.answer": submittedInfo.answer
                            };
                        }
                        else {
                            obj = {
                                "mcqSolution.$.status": quizQuestionStatus
                            };
                        }
                    }
                    else {
                        quizQuestionStatus = "skipped";
                        obj = {
                            "$set": {
                                "mcqSolution.$.status": quizQuestionStatus,
                            },
                            "$unset": {
                                "mcqSolution.$.answer": 1
                            }
                        };
                    }
                    var evalu = submittedInfo.evalutionId;
                    var evaluatedQuestion = yield mdb_1.mdbModels.Evalution.findOneAndUpdate({
                        _id: evalu, userId: userId, "mcqSolution.questionId": questionId, quizId: quizId
                    }, { "$set": obj }, { upsert: true, "new": true }).exec();
                    return evaluatedQuestion;
                }
                else {
                    throw `No quiz found with Id ${quizId}`;
                }
            }
            catch (error) {
                throw error;
            }
        });
        this.EvaluateQuizResult = (userId, quizId, evaluateResultDetails) => __awaiter(this, void 0, void 0, function* () {
            try {
                var score = 0;
                evaluateResultDetails.mcqSolution.forEach(x => {
                    if (!this._.isNil(x)) {
                        if (x.status === "correct") {
                            score = score + 2;
                        }
                    }
                });
                var updateQuizScore = yield mdb_1.mdbModels.Evalution.findOneAndUpdate({ _id: evaluateResultDetails.evalutionId, userId: userId, quizId: quizId }, { $push: { mcqSolution: evaluateResultDetails.mcqSolution }, $set: { acquiredScore: score, completedDate: new Date() } }, { upsert: true, new: true }).exec();
                return updateQuizScore;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetUserEvaluationResult = (userId, quizId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var quizEvaluation = yield mdb_1.mdbModels.Evalution.findOne({ userId: userId, quizId: quizId, completedDate: { $exists: true } }).exec();
                if (this._.isNil(quizEvaluation)) {
                    throw `user may not have completed the quiz`;
                }
                var quizQuestions = yield mdb_1.mdbModels.Quizzes.findOne({ _id: quizId }).select("questions.question questions.solution").exec();
                var finalResult = {
                    totalScore: quizEvaluation.totalScore,
                    acquiredScore: quizEvaluation.acquiredScore
                };
                if (!this._.isNil(quizQuestions)) {
                    finalResult.questions = quizQuestions.questions;
                }
                return finalResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetPostAuthorID = (postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var result = yield mdb_1.mdbModels.Post.findOne({ _id: postId }).select("userId").exec();
                return result;
            }
            catch (error) {
                throw error;
            }
        });
        this.DeletePost = (postId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var result = yield mdb_1.mdbModels.Post.findOneAndRemove({ _id: postId, userId: userId }).exec();
                return result;
            }
            catch (error) {
                throw error;
            }
        });
        this.AddPostComment = (postComment) => __awaiter(this, void 0, void 0, function* () {
            try {
                var postCommentQuery = yield mdb_1.mdbModels.PostComments.create(postComment);
                return postCommentQuery;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdatePostCommentCount = (postId, count) => __awaiter(this, void 0, void 0, function* () {
            try {
                var postCommentCount = yield mdb_1.mdbModels.Post.findOneAndUpdate({ _id: postId }, { $inc: { totalCommentCount: count } }).exec();
                return postCommentCount;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdateClapsCountForPost = (postId, count) => __awaiter(this, void 0, void 0, function* () {
            try {
                var postCommentCount = yield mdb_1.mdbModels.Post.findOneAndUpdate({ _id: postId }, { "totalClapsCount": count }, { upsert: true, "new": true }).exec();
                return postCommentCount;
            }
            catch (error) {
                throw error;
            }
        });
        this.UpdatePostComment = (postId, userId, updatePostComment) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.PostComments.findOneAndUpdate({
                    _id: updatePostComment.commentId,
                    userId: userId,
                    postId: postId
                }, { $set: { comment: updatePostComment.comment } }, { upsert: true, new: true }).exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.DeletePostComment = (commentId, postId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var queryResult = yield mdb_1.mdbModels.PostComments.remove({ _id: commentId, postId: postId, userId: userId }).exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetPostComments = (postId, searchRequest, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var criteria = { postId: postId };
                if (!this._.isNil(userId)) {
                    var userReportedPostCommentIds = yield this.GetUserReportedPostComments(userId, postId);
                    if (userReportedPostCommentIds.length > 0) {
                        criteria._id = { $nin: userReportedPostCommentIds };
                    }
                }
                var queryResult = yield mdb_1.mdbModels.PostComments.find(criteria)
                    .skip(searchRequest.from)
                    .limit(searchRequest.size)
                    .sort({ "createdAt": -1 })
                    .exec();
                return queryResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.AddPostClaps = (postId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
                this.log.info(`postId: ${postId}`);
                var key = `${this.postClapsByUser}:${postId}`;
                var resp = yield this.rF.redisClient.zaddAsync(key, new Date().getTime(), userId);
                if (resp === 1) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetClapsForPostCount = (postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
                this.log.info(`postId: ${postId}`);
                var keyPost = `${this.postClapsByUser}:${postId}`;
                var response = yield this.rF.redisClient.zcardAsync(keyPost);
                return response;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.RemovePostClaps = (postId, userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
                let keyComment = `${this.postClapsByUser}:${postId}`;
                var response = yield this.rF.redisClient.zremAsync(keyComment, userId);
                return response;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetUserClaps = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
                let key = `${this.postClapsByUser}:${postId}`;
                var result = yield this.rF.redisClient.zscoreAsync(key, userId);
                if (this._.isNil(result))
                    return false;
                else
                    return true;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetChallenges = (paginate) => __awaiter(this, void 0, void 0, function* () {
            try {
                var query = yield mdb_1.mdbModels.Challenges.find({})
                    .select("title imageUrl tags")
                    .skip(paginate.from)
                    .limit(paginate.size)
                    .sort({ "createdAt": -1 })
                    .exec();
                return query;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetChallenge = (challengeId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var challengeResult = yield mdb_1.mdbModels.Challenges.findOne({ _id: challengeId }).exec();
                return challengeResult;
            }
            catch (error) {
                throw error;
            }
        });
        this.GetUsers = (searchUserObj) => __awaiter(this, void 0, void 0, function* () {
            try {
                var result = yield mdb_1.mdbModels.Auth.find({ childName: { $regex: searchUserObj.userName, $options: 'i' } })
                    .select("userId childName parentName city")
                    .skip(searchUserObj.from)
                    .limit(searchUserObj.size)
                    .sort({ "childName": -1 })
                    .exec();
                return result;
            }
            catch (error) {
                throw error;
            }
        });
        this.SearchPosts = (searchPosts) => __awaiter(this, void 0, void 0, function* () {
            try {
                var result = mdb_1.mdbModels.Post.find({ $text: { $search: searchPosts.keyword } })
                    .skip(searchPosts.from)
                    .limit(searchPosts.size)
                    .sort({ "createdAt": -1 })
                    .exec();
                return result;
            }
            catch (error) {
                throw error;
            }
        });
        this.SearchChallenge = (SearchChallenge) => __awaiter(this, void 0, void 0, function* () {
            try {
                var result = mdb_1.mdbModels.Challenges.find({ $text: { $search: SearchChallenge.keyword } })
                    .skip(SearchChallenge.from)
                    .limit(SearchChallenge.size)
                    .sort({ "createdAt": -1 })
                    .exec();
                return result;
            }
            catch (error) {
                throw error;
            }
        });
        this.UserReportOnPost = (userId, reportDetails) => __awaiter(this, void 0, void 0, function* () {
            try {
                var reportedPostModel = {
                    postId: reportDetails.postId,
                    userId: userId,
                    userReport: reportDetails.userReport,
                    reportedDate: new Date()
                };
                var result = yield mdb_1.mdbReviewModels.ReportedPosts.create(reportedPostModel);
                if (!this._.isNil(result)) {
                    yield this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);
                    var keyUser = `${this.reportPostsByUser}:${userId}`;
                    var response = yield this.rF.redisClient.saddAsync(keyUser, reportDetails.postId);
                    if (response === 1 || response === 0) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    throw `Failed to add user report with cause`;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetUserReportedPosts = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);
                var keyUser = `${this.reportPostsByUser}:${userId}`;
                var result = yield this.rF.redisClient.smembersAsync(keyUser);
                return result;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.UserReportOnPostComment = (userId, postCommentReport) => __awaiter(this, void 0, void 0, function* () {
            try {
                var reportedPostCommentModel = {
                    postId: postCommentReport.postId,
                    userId: userId,
                    commentId: postCommentReport.commentId,
                    userReport: postCommentReport.userReport,
                    reportedDate: new Date()
                };
                var result = yield mdb_1.mdbReviewModels.ReportedPostComments.create(reportedPostCommentModel);
                if (!this._.isNil(result)) {
                    yield this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);
                    var response, arrCommentID;
                    var keyUser = `${this.reportPostCommentByUser}:${userId}`;
                    var userResponse = yield this.rF.redisClient.hgetAsync(keyUser, postCommentReport.postId);
                    if (userResponse === null) {
                        arrCommentID = [postCommentReport.commentId];
                        response = yield this.rF.redisClient.hsetAsync(keyUser, postCommentReport.postId, JSON.stringify(arrCommentID));
                    }
                    else {
                        arrCommentID = JSON.parse(userResponse);
                        arrCommentID.push(postCommentReport.commentId);
                        response = yield this.rF.redisClient.hsetAsync(keyUser, postCommentReport.postId, JSON.stringify(this._.uniq(arrCommentID)));
                    }
                    if (response === 0 || response === 1) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    throw `Failed to add post comment.`;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetUserReportedPostComments = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);
                var keyUser = `${this.reportPostCommentByUser}:${userId}`;
                var userResponse = yield this.rF.redisClient.hgetAsync(keyUser, postId);
                var postCommentIds;
                if (!this._.isNil(userResponse)) {
                    postCommentIds = JSON.parse(userResponse);
                }
                else {
                    postCommentIds = [];
                }
                return postCommentIds;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.isQuizTaken = (userId, quizId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var query = yield mdb_1.mdbModels.Evalution.findOne({ completedDate: { $exists: true }, userId: userId, quizId: quizId }).exec();
                if (!this._.isNil(query)) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                throw error;
            }
        });
        this.FollowUser = (userId, userIdToFollow) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                session = neo4jFactory_1.driver.session();
                var followKey = `${userId}-TO-${userIdToFollow}`;
                var addFollows = `MATCH (a:User {UserID: '${userId}'}), (b:User {UserID: '${userIdToFollow}'}) MERGE (a)-[r:Follows {FollowKey: '${followKey}'}]->(b) ON CREATE SET r.Since = timestamp()`;
                var follows = yield session.run(addFollows);
                session.close();
                if (follows.summary.updateStatistics._stats.relationshipsCreated > 0) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                this.log.error("following user", error);
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.UnFollowUser = (userId, userIdToUnfollow) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                session = neo4jFactory_1.driver.session();
                var unFollow = `MATCH (:User) - [r:Follows {FollowKey: '${userId}-TO-${userIdToUnfollow}'}] -> (:User) DELETE r`;
                var unFollows = yield session.run(unFollow);
                session.close();
                if (unFollows.summary.updateStatistics._stats.relationshipsDeleted > 0) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                this.log.error("unfollow user", error);
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.IsFollowingUser = (userId, followingUserId) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                if (userId !== followingUserId) {
                    session = neo4jFactory_1.driver.session();
                    var isFollowing = `MATCH (:User {UserID: '${userId}'}) - [r:Follows] -> (:User{UserID: '${followingUserId}'}) RETURN r`;
                    var response = yield session.run(isFollowing);
                    session.close();
                    if (response.records.length > 0) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
            catch (error) {
                this.log.error("", error);
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.CreateNeoUser = (userInfo) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                session = neo4jFactory_1.driver.session();
                var userQuery = `CREATE (n:User) SET n.ChildName = '${userInfo.childName}', n.UserID = '${userInfo.userId}', n.DOB = ${userInfo.DOB} RETURN n`;
                let userCreated = yield session.run(userQuery);
                session.close();
                if (!this._.isNil(userCreated) && userCreated.records.length > 0) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.GetFollowers = (userId) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                session = neo4jFactory_1.driver.session();
                var params = {
                    userId: userId
                };
                var query = `MATCH (n:User{UserID:{userId}})<-[r:Follows]-(m:User) RETURN m`;
                var queryResult = yield session.run(query, params);
                session.close();
                var followersList = [];
                queryResult.records.forEach(x => {
                    followersList.push({
                        userName: x._fields[0].properties.ChildName,
                        userId: x._fields[0].properties.UserID
                    });
                });
                return followersList;
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.GetFollowing = (userId) => __awaiter(this, void 0, void 0, function* () {
            let session;
            try {
                session = neo4jFactory_1.driver.session();
                var params = {
                    userId: userId
                };
                var query = `MATCH (n:User{UserID:{userId}})-[r:Follows]->(m:User) RETURN m`;
                var queryResult = yield session.run(query, params);
                session.close();
                var followersList = [];
                queryResult.records.forEach(x => {
                    followersList.push({
                        userName: x._fields[0].properties.ChildName,
                        userId: x._fields[0].properties.UserID,
                        isFollowing: true
                    });
                });
                return followersList;
            }
            catch (error) {
                throw error;
            }
            finally {
                if (!this._.isNil(session))
                    session.close();
            }
        });
        this.AddNotification = (notification) => __awaiter(this, void 0, void 0, function* () {
            try {
                var notificationDetails = {
                    toUserId: notification.toUserId,
                    notificationType: notification.type,
                    fromUserId: notification.fromUserId,
                    fromUserName: notification.fromUserName,
                    isRead: false
                };
                if (notification.type === vm_1.VM.userNotificationType.POST_CLAPS) {
                    notificationDetails.data = JSON.stringify(notification.postClaps);
                }
                else if (notification.type === vm_1.VM.userNotificationType.POST_COMMENT) {
                    notificationDetails.data = JSON.stringify(notification.postComment);
                }
                else if (notification.type === vm_1.VM.userNotificationType.USER_FOLLOWING) {
                    notificationDetails.data = JSON.stringify(notification.userFollowing);
                }
                var result = yield mdb_1.mdbModels.Notifications.create(notificationDetails);
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                yield this.rF.redisClient.hincrbyAsync(this.userNotificationsCount, notificationDetails.toUserId, 1);
                return result;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetNotifications = (userId, from, size) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                yield this.rF.redisClient.hsetAsync(this.userNotificationsCount, userId, 0);
                var notifications = yield mdb_1.mdbModels.Notifications.find({ toUserId: userId })
                    .skip(from)
                    .limit(size)
                    .sort({ createdAt: -1 })
                    .exec();
                if (this._.isNil(notifications)) {
                    return [];
                }
                else {
                    notifications = notifications.map(x => {
                        x = x.toObject();
                        x.data = JSON.parse(x.data);
                        return x;
                    });
                    return notifications;
                }
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.GetUnReadNotificationsCount = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
                var unReadNotificationsCount = yield this.rF.redisClient.hgetAsync(this.userNotificationsCount, userId);
                return unReadNotificationsCount;
            }
            catch (error) {
                throw error;
            }
            finally {
                this.rF.Disconnect();
            }
        });
        this.MarkNotificationsAsRead = (userId, notificationId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var markedNotification = yield mdb_1.mdbModels.Notifications.findOneAndUpdate({
                    _id: notificationId,
                    toUserId: userId
                }, {
                    $set: {
                        isRead: true
                    }
                }, {
                    "upsert": true,
                    "new": true
                }).exec();
                return markedNotification;
            }
            catch (error) {
                throw error;
            }
        });
        this.MarkAllNotificationsAsRead = (userId) => __awaiter(this, void 0, void 0, function* () {
            try {
                var markedNotifications = yield mdb_1.mdbModels.Notifications.update({
                    toUserId: userId
                }, {
                    $set: {
                        "isRead": true
                    }
                }, { multi: true, upsert: true }).exec();
                return markedNotifications;
            }
            catch (error) {
                throw error;
            }
        });
        this.rF = new redisFactory_1.RedisFactory();
        this.usersLastLogin = "usersLastLogin";
        this.postClapsByUser = "postClapsByUser";
        this.reportPostsByUser = "reportPostsByUser";
        this.reportPostCommentByUser = "reportPostCommentByUser";
        this.userNotificationsCount = "userNotificationsCount";
        this.userPoints = "userPoints";
    }
}
exports.UserAuthService = UserAuthService;

//# sourceMappingURL=userAuthService.js.map
