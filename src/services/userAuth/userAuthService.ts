import dbTypes = require("../../models/collections");
import { mdbModels, mdbReviewModels } from "../../models/mdb";
import { BaseService } from "../../policies/baseService";
import { RedisFactory } from "../../factories/redisFactory";
import { VM } from "../../models/vm";
import { driver } from "../../factories/neo4jFactory";

export class UserAuthService extends BaseService {

    private rF: RedisFactory;
    private usersLastLogin: string;
    private postClapsByUser: string;
    private reportPostsByUser: string;
    private reportPostCommentByUser: string;
    private userNotificationsCount: string;
    private userPoints: string;
    constructor() {
        super();
        this.rF = new RedisFactory();
        this.usersLastLogin = "usersLastLogin";
        this.postClapsByUser = "postClapsByUser";
        this.reportPostsByUser = "reportPostsByUser";
        this.reportPostCommentByUser = "reportPostCommentByUser";
        this.userNotificationsCount = "userNotificationsCount";
        this.userPoints = "userPoints";
    }

    public CheckUser = async (userId: string): Promise<any> => {
        try {
            if (this._.isNil(userId)) {
                throw `No userId sent.`;
            }
            this.log.info(userId + " Check User");

            var userQuery = await mdbModels.Auth.findOne({ userId: userId }).exec();

            return userQuery;

        } catch (error) {
            this.log.error("Check CheckUser", error);
            throw error;
        }
    };

    public CreateUser = async (userInfo: dbTypes.IAuth): Promise<any> => {
        try {
            var createUser = await mdbModels.Auth.create(userInfo);

            return createUser;
        } catch (error) {
            this.log.error("Create User", error);
            throw error;
        }
    };

    public SetUserLastLogin = async (userId: string): Promise<void> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);

            this.log.info(`userInfo: ${userId}`);

            var key = `${this.usersLastLogin}`;
            var resp = await this.rF.redisClient.zaddAsync(key, new Date().getTime(), userId);

            return resp;

        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public AddPost = async (userPost: VM.IPost): Promise<any> => {
        try {
            var addPostQuery = await mdbModels.Post.create(userPost);

            return addPostQuery;
        } catch (error) {
            throw error;
        }
    };

    public AddUserPoints = async (type: string, userId: string, sourceId: string, points: number): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);

            this.log.info(`userInfo: ${userId}`);

            var key = `${this.userPoints}:${userId}`;
            var resp = await this.rF.redisClient.hincrbyAsync(key, "points", points);

            var pointsLog = {
                type: type,
                userId: userId,
                sourceId: sourceId,
                points: points
            }

            await mdbModels.PointsLog.create(pointsLog);

            return resp;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public DeleteUserPoints = async (type: string, userId: string, sourceId: string, points: number): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);

            this.log.info(`userInfo: ${userId}`);

            var key = `${this.userPoints}:${userId}`;
            var resp = await this.rF.redisClient.hincrbyAsync(key, "points", -points);

            var pointsLog = {
                type: type,
                userId: userId,
                sourceId: sourceId,
                points: -points
            }

            await mdbModels.PointsLog.create(pointsLog);

            return resp;
        } catch (error) {
            throw error;
        }
    };

    public GetPosts = async (searchRequest: VM.IPostVM, userId: string): Promise<any> => {
        try {
            var criteria: any = { userId: { $exists: true } };

            if (!this._.isNil(searchRequest.type)) {
                criteria.type = searchRequest.type
            }

            if (!this._.isNil(searchRequest.challengeId)) {
                criteria.challengeId = searchRequest.challengeId;
            }

            if (!this._.isNil(searchRequest.userId)) {
                criteria.userId = searchRequest.userId;
            }

            var userReportedPostIds = await this.GetUserReportedPosts(userId);

            if (!this._.isNil(userReportedPostIds) && userReportedPostIds.length > 0) {
                criteria._id = { $nin: userReportedPostIds }
            }

            var results = await mdbModels.Post.find(criteria)
                .skip(searchRequest.from)
                .limit(searchRequest.size)
                .sort({ "createdAt": -1 })
                .exec()

            return results;
        } catch (error) {
            throw error;
        }
    };

    public GetPost = async (postId: string): Promise<any> => {
        try {
            var postResult = await mdbModels.Post.findOne({ _id: postId }).exec();

            return postResult;
        } catch (error) {
            throw error;
        }
    };

    public UpdatePost = async (updatePostDetails: VM.IPost, postId: string): Promise<any> => {
        try {
            var queryResult = await mdbModels.Post.findOneAndUpdate({ _id: postId }, { $set: updatePostDetails }, { upsert: true, new: true }).exec();
            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public GetUserProfile = async (userId: string, userId2: any): Promise<VM.IUserProfile> => {
        try {
            var userProfile: any = {};
            var userDetails = await mdbModels.Auth.findOne({ userId: userId }).select("childName city aboutus").exec();
            if (!this._.isNil(userDetails)) {
                var usersPostCount = await mdbModels.Post.count({ userId: userId }).exec();

                var isFollowing = false;

                if (!this._.isNil(userId2)) {
                    isFollowing = await this.IsFollowingUser(userId2, userId);
                }

                var followersAndFollowingCount = await this.GetFollowerOrFollowingCount(userId);

                userProfile.childName = userDetails.childName;
                userProfile.userId = userId;
                userProfile.aboutYou = userDetails.aboutus;
                userProfile.postCount = usersPostCount;
                userProfile.followersCount = followersAndFollowingCount.followersCount;
                userProfile.followingCount = followersAndFollowingCount.followingsCount;
                userProfile.isFollowing = isFollowing;

                await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);

                var keyUser = `${this.userPoints}:${userId}`;

                var points = await this.rF.redisClient.hgetAsync(keyUser, "points");

                userProfile.userPoints = this._.isNil(points) ? 0 : Number(points);

                if (!this._.isNil(userDetails.city)) {
                    userProfile.city = userDetails.city;
                }
            }
            return userProfile;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetFollowerOrFollowingCount = async (userId: string): Promise<any> => {
        let session;
        try {
            var followingsCount = 0;
            var followersCount = 0;

            var params = {
                userId: userId
            }
            session = driver.session();
            var followingQuery = `MATCH (n:User{UserID:{userId}})-[r:Follows]->() RETURN count(r)`;
            var followingResp = await session.run(followingQuery, params);

            if (followingResp.records.length > 0) {
                followingsCount = followingResp.records[0]._fields[0].toNumber();
            }

            var followersQuery = `MATCH (n:User{UserID:{userId}})<-[r:Follows]-() RETURN count(r)`;
            var followersResp = await session.run(followersQuery, params);

            if (followersResp.records.length > 0) {
                followersCount = followersResp.records[0]._fields[0].toNumber();
            }

            session.close();

            return {
                followingsCount: followingsCount,
                followersCount: followersCount
            }
        } catch (error) {
            throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    }

    public GetUserDetails = async (userId): Promise<any> => {
        try {
            var queryResult = await mdbModels.Auth.findOne({ userId: userId }).exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public UpdateUserDetails = async (userId: string, userInfo: VM.IUserInfo): Promise<any> => {
        try {
            var queryResult = await mdbModels.Auth.findOneAndUpdate({ userId: userId }, { $set: userInfo }, { upsert: true }).exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public UpdateUserName = async (userId: string, childName: string): Promise<any> => {
        let session;
        try {
            await mdbModels.Post.update({ userId: userId }, { userName: childName }, { multi: true, upsert: true }).exec();
            await mdbModels.PostComments.update({ userId: userId }, { userName: childName }, { upsert: true, multi: true }).exec();
            await mdbModels.Notifications.update({ fromUserId: userId }, { fromUserName: childName }, { upsert: true, multi: true }).exec();

            var params = {
                userId: userId,
                childName: childName
            }

            var neoQuery = `MATCH (n:User) WHERE n.UserID = {userId} SET n.ChildName = {childName} RETURN n`

            session = driver.session();
            var queryResult = await session.run(neoQuery, params);
            session.close();

            if (this._.isNil(queryResult)) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public GetUserAge = (dob: number) => {
        try {
            var today = new Date();
            var birthDate = new Date(dob);
            var age = today.getFullYear() - birthDate.getFullYear();
            var m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (error) {
            throw error;
        }
    };

    public GetQuizzes = async (searchRequest: VM.IQuizzesVM): Promise<any> => {
        try {
            var ageGroup;

            if (searchRequest.age < 7) {
                ageGroup = "3-7"
            } else if (searchRequest.age >= 7 && searchRequest.age < 11) {
                ageGroup = "7-11"
            } else if (searchRequest.age >= 11 && searchRequest.age <= 16) {
                ageGroup = "11-16"
            }

            var completedQuizIds = await this.GetUserCompletedQuizIds(searchRequest.userId, searchRequest.from, searchRequest.size);

            var queryResult = await mdbModels.Quizzes.find({ agegroup: ageGroup, _id: { $nin: completedQuizIds } }).select("title duration agegroup").exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public GetCompletedQuizzes = async (searchRequest: VM.IQuizzesVM): Promise<any> => {
        try {
            var ageGroup;

            if (searchRequest.age < 7) {
                ageGroup = "3-7"
            } else if (searchRequest.age >= 7 && searchRequest.age < 11) {
                ageGroup = "7-11"
            } else if (searchRequest.age >= 11 && searchRequest.age <= 16) {
                ageGroup = "11-16"
            }

            var completedQuizIds = await this.GetUserCompletedQuizIds(searchRequest.userId, searchRequest.from, searchRequest.size);

            var queryResult = await mdbModels.Quizzes.find({ agegroup: ageGroup, _id: { $in: completedQuizIds } }).select("title duration agegroup").exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    }

    public GetUserCompletedQuizIds = async (userId: string, from: number, size: number): Promise<any> => {
        try {
            var query = await mdbModels.Evalution.find({ userId: userId })
                .select("quizId")
                .skip(from)
                .limit(size)
                .exec();

            var quizIds: string[] = [];

            query.forEach(x => {
                quizIds.push(x.quizId);
            });

            return quizIds;
        } catch (error) {
            throw error;
        }
    }

    public StartQuiz = async (userId: string, quizId: string): Promise<any> => {
        try {
            var startedQuiz = await mdbModels.Evalution.findOne({ completedDate: { $exists: false }, userId: userId, quizId: quizId }).exec();

            if (!this._.isNil(startedQuiz)) {
                throw `You have not completed the quiz ${quizId}`;
            }

            var quiz = await mdbModels.Quizzes.findOne({ _id: quizId }).exec();

            if (this._.isNil(quiz)) {
                throw `No quiz found with id ${quiz}`;
            }

            // var mcqSolutions = quiz.questions.map(x => {
            //     return <dbTypes.IMCQSolution>{
            //         questionId: x._id,
            //         status: "skipped"
            //     };
            // });

            var totalScore = quiz.questions.length * 2;

            var evalution = <dbTypes.IEvalution>{
                userId: userId,
                quizId: quizId,
                totalScore: totalScore,
                acquiredScore: 0,
                completedDate: new Date()
                // mcqSolution: mcqSolutions
            };

            var evalutionReport = await mdbModels.Evalution.create(evalution);

            return evalutionReport;
        } catch (error) {
            throw error;
        }
    };

    public GetQuizQuestions = async (quizId: string): Promise<any> => {
        try {
            var queryResult: any = await mdbModels.Quizzes.findOne({ _id: quizId }).select("questions").exec()

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public UpdateSolutionForQuizQuestion = async (userId: string, quizId: string, questionId: string, submittedInfo: VM.IUpdateQuizAnswer): Promise<any> => {
        try {
            var quizQuestionStatus = "incorrect";

            var quizQuestions = await mdbModels.Quizzes.findOne({ _id: quizId, questions: { $elemMatch: { _id: questionId } } }).select("questions._id questions.solution").exec();

            if (!this._.isNil(quizQuestions)) {
                var questions = quizQuestions.questions;

                var solution;

                questions.forEach(x => {
                    if (x._id.toHexString() === questionId)
                        solution = x.solution;
                })

                var obj = {};

                if (!this._.isNil(submittedInfo.answer)) {
                    if (solution === submittedInfo.answer) {
                        quizQuestionStatus = "correct";

                        obj = {
                            "mcqSolution.$.status": quizQuestionStatus,
                            "mcqSolution.$.answer": submittedInfo.answer
                        }
                    } else {
                        obj = {
                            "mcqSolution.$.status": quizQuestionStatus
                        }
                    }
                } else {
                    quizQuestionStatus = "skipped";

                    obj = {
                        "$set": {
                            "mcqSolution.$.status": quizQuestionStatus,
                        },
                        "$unset": {
                            "mcqSolution.$.answer": 1
                        }
                    }
                }

                var evalu = submittedInfo.evalutionId;

                var evaluatedQuestion = await mdbModels.Evalution.findOneAndUpdate({
                    _id: evalu, userId: userId, "mcqSolution.questionId": questionId, quizId: quizId
                }, { "$set": obj }, { upsert: true, "new": true }).exec();

                return evaluatedQuestion;

            } else {
                throw `No quiz found with Id ${quizId}`;
            }
        } catch (error) {
            throw error;
        }
    };

    public EvaluateQuizResult = async (userId: string, quizId: string, evaluateResultDetails: VM.IEvaluateResultParams): Promise<any> => {
        try {
            // var quizEvaluation = await mdbModels.Evalution.findOne({ userId: userId, quizId: quizId, _id: evaluateResultDetails.evalutionId }).exec();

            // if (this._.isNil(quizEvaluation)) {
            //     throw `No quiz evaluation found`;
            // }

            var score = 0;

            evaluateResultDetails.mcqSolution.forEach(x => {
                if (x.status === "correct") {
                    score = score + 2;
                }
            });

            var updateQuizScore = await mdbModels.Evalution.findOneAndUpdate({ _id: evaluateResultDetails.evalutionId, userId: userId, quizId: quizId }, { $push: { mcqSolution: evaluateResultDetails.mcqSolution }, $set: { acquiredScore: score, completedDate: new Date() } }, { upsert: true, new: true }).exec();

            return updateQuizScore;
        } catch (error) {
            throw error;
        }
    };

    public GetUserEvaluationResult = async (userId: string, quizId: string): Promise<any> => {
        try {
            var quizEvaluation = await mdbModels.Evalution.findOne({ userId: userId, quizId: quizId, completedDate: { $exists: true } }).exec();

            if (this._.isNil(quizEvaluation)) {
                throw `user may not have completed the quiz`;
            }

            var quizQuestions = await mdbModels.Quizzes.findOne({ _id: quizId }).select("questions.question questions.solution").exec();

            var finalResult: any = {
                totalScore: quizEvaluation.totalScore,
                acquiredScore: quizEvaluation.acquiredScore
            }

            if (!this._.isNil(quizQuestions)) {
                finalResult.questions = quizQuestions.questions;
            }

            return finalResult;

        } catch (error) {
            throw error;
        }
    }

    public GetPostAuthorID = async (postId: string): Promise<any> => {
        try {
            var result = await mdbModels.Post.findOne({ _id: postId }).select("userId").exec();

            return result;
        } catch (error) {
            throw error;
        }
    };

    public DeletePost = async (postId: string, userId: string): Promise<any> => {
        try {
            var result = await mdbModels.Post.findOneAndRemove({ _id: postId, userId: userId }).exec();

            return result;
        } catch (error) {
            throw error;
        }
    };

    public AddPostComment = async (postComment: VM.IPostComment): Promise<any> => {
        try {
            var postCommentQuery = await mdbModels.PostComments.create(postComment);

            return postCommentQuery;
        } catch (error) {
            throw error;
        }
    };

    public UpdatePostCommentCount = async (postId: string, count: number): Promise<any> => {
        try {
            var postCommentCount = await mdbModels.Post.findOneAndUpdate({ _id: postId }, { $inc: { totalCommentCount: count } }).exec();

            return postCommentCount;
        } catch (error) {
            throw error;
        }
    };

    public UpdateClapsCountForPost = async (postId: string, count: number): Promise<any> => {
        try {
            var postCommentCount = await mdbModels.Post.findOneAndUpdate({ _id: postId }, { $inc: { totalClapsCount: count } }).exec();

            return postCommentCount;
        } catch (error) {
            throw error;
        }
    }

    public UpdatePostComment = async (postId: string, userId: string, updatePostComment: VM.IPostCommentUpdate): Promise<any> => {
        try {
            var queryResult = await mdbModels.PostComments.findOneAndUpdate(
                {
                    _id: updatePostComment.commentId,
                    userId: userId,
                    postId: postId
                },
                { $set: { comment: updatePostComment.comment } },
                { upsert: true, new: true }).exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public DeletePostComment = async (commentId: string, postId: string, userId: string): Promise<any> => {
        try {
            var queryResult = await mdbModels.PostComments.remove({ _id: commentId, postId: postId, userId: userId }).exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public GetPostComments = async (postId: string, searchRequest: VM.IPaginate, userId: string): Promise<any> => {
        try {

            var criteria: any = { postId: postId };

            if (!this._.isNil(userId)) {
                var userReportedPostCommentIds = await this.GetUserReportedPostComments(userId, postId);

                if (userReportedPostCommentIds.length > 0) {
                    criteria._id = { $nin: userReportedPostCommentIds }
                }
            }

            var queryResult = await mdbModels.PostComments.find(criteria)
                .skip(searchRequest.from)
                .limit(searchRequest.size)
                .sort({ "createdAt": -1 })
                .exec()

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public AddPostClaps = async (postId: string, userId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbPost);

            this.log.info(`postId: ${postId}`);

            var key = `${this.postClapsByUser}:${postId}`;
            var resp = await this.rF.redisClient.zaddAsync(key, new Date().getTime(), userId);

            if (resp === 1) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetClapsForPostCount = async (postId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbPost);

            this.log.info(`postId: ${postId}`);

            var keyPost = `${this.postClapsByUser}:${postId}`;

            var response = await this.rF.redisClient.zcardAsync(keyPost);

            return response;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public RemovePostClaps = async (postId: string, userId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
            let keyComment = `${this.postClapsByUser}:${postId}`;

            var response = await this.rF.redisClient.zremAsync(keyComment, userId);

            return response;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetUserClaps = async (userId: string, postId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbPost);
            let key = `${this.postClapsByUser}:${postId}`;

            var result = await this.rF.redisClient.zscoreAsync(key, userId);
            if (this._.isNil(result))
                return false;
            else
                return true;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetChallenges = async (paginate: VM.IPaginate): Promise<any> => {
        try {
            var query = await mdbModels.Challenges.find({})
                .select("title imageUrl tags")
                .skip(paginate.from)
                .limit(paginate.size)
                .sort({ "createdAt": -1 })
                .exec()

            return query;
        } catch (error) {
            throw error;
        }
    };

    public GetChallenge = async (challengeId: string): Promise<any> => {
        try {
            var challengeResult = await mdbModels.Challenges.findOne({ _id: challengeId }).exec();

            return challengeResult;
        } catch (error) {
            throw error;
        }
    };

    public GetUsers = async (searchUserObj: VM.ISearchUser): Promise<any> => {
        try {
            var result = await mdbModels.Auth.find({ childName: { $regex: searchUserObj.userName, $options: 'i' } })
                .select("userId childName parentName city")
                .skip(searchUserObj.from)
                .limit(searchUserObj.size)
                .sort({ "childName": -1 })
                .exec();

            return result;
        } catch (error) {
            throw error;
        }
    };

    public SearchPosts = async (searchPosts: VM.ISearch): Promise<any> => {
        try {
            var result = mdbModels.Post.find({ $text: { $search: searchPosts.keyword } })
                .skip(searchPosts.from)
                .limit(searchPosts.size)
                .sort({ "createdAt": -1 })
                .exec()

            return result;
        } catch (error) {
            throw error;
        }
    };

    public SearchChallenge = async (SearchChallenge: VM.ISearch): Promise<any> => {
        try {
            var result = mdbModels.Challenges.find({ $text: { $search: SearchChallenge.keyword } })
                .skip(SearchChallenge.from)
                .limit(SearchChallenge.size)
                .sort({ "createdAt": -1 })
                .exec()

            return result;
        } catch (error) {
            throw error;
        }
    };

    public UserReportOnPost = async (userId: string, reportDetails: VM.IUserPostReport): Promise<any> => {
        try {
            var reportedPostModel = <dbTypes.IReportedPosts>{
                postId: reportDetails.postId,
                userId: userId,
                userReport: reportDetails.userReport,
                reportedDate: new Date()
            };

            var result = await mdbReviewModels.ReportedPosts.create(reportedPostModel);

            if (!this._.isNil(result)) {

                await this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);

                var keyUser = `${this.reportPostsByUser}:${userId}`;
                var response = await this.rF.redisClient.saddAsync(keyUser, reportDetails.postId);

                if (response === 1 || response === 0) {
                    return true
                } else {
                    return false;
                }

            } else {
                throw `Failed to add user report with cause`;
            }
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetUserReportedPosts = async (userId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);

            var keyUser = `${this.reportPostsByUser}:${userId}`;

            var result = await this.rF.redisClient.smembersAsync(keyUser);

            return result;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public UserReportOnPostComment = async (userId: string, postCommentReport: VM.IUserPostCommentReport): Promise<any> => {
        try {

            var reportedPostCommentModel = <dbTypes.IReportedPostComments>{
                postId: postCommentReport.postId,
                userId: userId,
                commentId: postCommentReport.commentId,
                userReport: postCommentReport.userReport,
                reportedDate: new Date()
            };

            var result = await mdbReviewModels.ReportedPostComments.create(reportedPostCommentModel);

            if (!this._.isNil(result)) {

                await this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);

                var response, arrCommentID: string[];

                var keyUser = `${this.reportPostCommentByUser}:${userId}`;
                var userResponse = await this.rF.redisClient.hgetAsync(keyUser, postCommentReport.postId);

                if (userResponse === null) {
                    arrCommentID = [postCommentReport.commentId];
                    response = await this.rF.redisClient.hsetAsync(keyUser, postCommentReport.postId, JSON.stringify(arrCommentID));
                }
                else {
                    arrCommentID = JSON.parse(userResponse);
                    arrCommentID.push(postCommentReport.commentId);
                    response = await this.rF.redisClient.hsetAsync(keyUser, postCommentReport.postId, JSON.stringify(this._.uniq(arrCommentID)));
                }

                if (response === 0 || response === 1) {
                    return true;
                }
                else {
                    return false;
                }
            } else {
                throw `Failed to add post comment.`;
            }
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetUserReportedPostComments = async (userId: string, postId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbReportPost);

            var keyUser = `${this.reportPostCommentByUser}:${userId}`;
            var userResponse = await this.rF.redisClient.hgetAsync(keyUser, postId);

            var postCommentIds: string[];

            if (!this._.isNil(userResponse)) {
                postCommentIds = JSON.parse(userResponse);
            } else {
                postCommentIds = [];
            }

            return postCommentIds;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public isQuizTaken = async (userId: string, quizId: string): Promise<any> => {
        try {
            var query = await mdbModels.Evalution.findOne({ completedDate: { $exists: true }, userId: userId, quizId: quizId }).exec();

            if (!this._.isNil(query)) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }
    };

    public FollowUser = async (userId: String, userIdToFollow: String): Promise<any> => {
        let session;
        try {
            session = driver.session();

            var followKey = `${userId}-TO-${userIdToFollow}`;

            var addFollows = `MATCH (a:User {UserID: '${userId}'}), (b:User {UserID: '${userIdToFollow}'}) MERGE (a)-[r:Follows {FollowKey: '${followKey}'}]->(b) ON CREATE SET r.Since = timestamp()`;

            var follows = await session.run(addFollows);

            session.close();

            if (follows.summary.updateStatistics._stats.relationshipsCreated > 0) {
                return true;
            }
            else {
                return false;
            }

        } catch (error) {
            this.log.error("following user", error); throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public UnFollowUser = async (userId: String, userIdToUnfollow: String): Promise<any> => {
        let session;
        try {
            session = driver.session();

            var unFollow = `MATCH (:User) - [r:Follows {FollowKey: '${userId}-TO-${userIdToUnfollow}'}] -> (:User) DELETE r`;
            var unFollows = await session.run(unFollow);
            session.close();

            if (unFollows.summary.updateStatistics._stats.relationshipsDeleted > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            this.log.error("unfollow user", error); throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public IsFollowingUser = async (userId: string, followingUserId: string): Promise<any> => {
        let session;

        try {
            if (userId !== followingUserId) {
                session = driver.session();

                var isFollowing = `MATCH (:User {UserID: '${userId}'}) - [r:Follows] -> (:User{UserID: '${followingUserId}'}) RETURN r`;
                var response = await session.run(isFollowing);
                session.close();

                if (response.records.length > 0) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (error) {
            this.log.error("", error); throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public CreateNeoUser = async (userInfo: any): Promise<any> => {
        let session;
        try {
            session = driver.session();

            var userQuery = `CREATE (n:User) SET n.ChildName = '${userInfo.childName}', n.UserID = '${userInfo.userId}', n.DOB = ${userInfo.DOB} RETURN n`;
            let userCreated = await session.run(userQuery);

            session.close();

            if (!this._.isNil(userCreated) && userCreated.records.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public GetFollowers = async (userId: string): Promise<any> => {
        let session;
        try {
            session = driver.session();

            var params = {
                userId: userId
            }

            var query = `MATCH (n:User{UserID:{userId}})<-[r:Follows]-(m:User) RETURN m`
            var queryResult = await session.run(query, params);
            session.close();

            var followersList: any = [];

            queryResult.records.forEach(x => {
                followersList.push({
                    userName: x._fields[0].properties.ChildName,
                    userId: x._fields[0].properties.UserID
                });
            });

            return followersList;

        } catch (error) {
            throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public GetFollowing = async (userId: string): Promise<any> => {
        let session;
        try {
            session = driver.session();

            var params = {
                userId: userId
            }

            var query = `MATCH (n:User{UserID:{userId}})-[r:Follows]->(m:User) RETURN m`
            var queryResult = await session.run(query, params);
            session.close();

            var followersList: any = [];

            queryResult.records.forEach(x => {
                followersList.push({
                    userName: x._fields[0].properties.ChildName,
                    userId: x._fields[0].properties.UserID,
                    isFollowing: true
                });
            });

            return followersList;

        } catch (error) {
            throw error;
        } finally {
            if (!this._.isNil(session))
                session.close();
        }
    };

    public AddNotification = async (notification: VM.INotifications): Promise<any> => {
        try {
            var notificationDetails: any = {
                toUserId: notification.toUserId,
                notificationType: notification.type,
                fromUserId: notification.fromUserId,
                fromUserName: notification.fromUserName,
                isRead: false
            }

            if (notification.type === VM.userNotificationType.POST_CLAPS) {
                notificationDetails.data = JSON.stringify(notification.postClaps);
            } else if (notification.type === VM.userNotificationType.POST_COMMENT) {
                notificationDetails.data = JSON.stringify(notification.postComment);
            } else if (notification.type === VM.userNotificationType.USER_FOLLOWING) {
                notificationDetails.data = JSON.stringify(notification.userFollowing);
            }

            var result = await mdbModels.Notifications.create(notificationDetails);

            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
            await this.rF.redisClient.hincrbyAsync(this.userNotificationsCount, notificationDetails.toUserId, 1);

            return result;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public GetNotifications = async (userId: string, from: number, size: number): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
            await this.rF.redisClient.hsetAsync(this.userNotificationsCount, userId, 0);

            var notifications: any = await mdbModels.Notifications.find({ toUserId: userId })
                .skip(from)
                .limit(size)
                .sort({ createdAt: -1 })
                .exec();

            if (this._.isNil(notifications)) {
                return [];
            } else {
                notifications = notifications.map(x => {
                    x = x.toObject();
                    x.data = JSON.parse(x.data);
                    return x;
                });

                return notifications;
            }
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };
    public GetUnReadNotificationsCount = async (userId: string): Promise<any> => {
        try {
            await this.rF.ConnectToRedis(this.rF.redisDB.dbUser);
            var unReadNotificationsCount = await this.rF.redisClient.hgetAsync(this.userNotificationsCount, userId);

            return unReadNotificationsCount;
        } catch (error) {
            throw error;
        } finally {
            this.rF.Disconnect();
        }
    };

    public MarkNotificationsAsRead = async (userId: string, notificationId: number): Promise<any> => {
        try {
            var markedNotification = await mdbModels.Notifications.findOneAndUpdate(
                {
                    _id: notificationId,
                    toUserId: userId
                },
                {
                    $set: {
                        isRead: true
                    }
                }, {
                    "upsert": true,
                    "new": true
                }).exec();

            return markedNotification;
        } catch (error) {
            throw error;
        }
    };

    public MarkAllNotificationsAsRead = async (userId: string): Promise<any> => {
        try {
            var markedNotifications = await mdbModels.Notifications.update({
                toUserId: userId
            }, {
                    $set: {
                        "isRead": true
                    }
                }, { multi: true, upsert: true }).exec();

            return markedNotifications;

        } catch (error) {
            throw error;
        }
    };
}