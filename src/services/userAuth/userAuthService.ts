import dbTypes = require("../../models/collections");
import { mdbModels } from "../../models/mdb";
import { BaseService } from "../../policies/baseService";
import { RedisFactory } from "../../factories/redisFactory";
import { VM } from "../../models/vm";

export class UserAuthService extends BaseService {

    private rF: RedisFactory;
    private usersLastLogin: string;
    private postClapsByUser: string;
    constructor() {
        super();
        this.rF = new RedisFactory();
        this.usersLastLogin = "usersLastLogin";
        this.postClapsByUser = "postClapsByUser";
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

    public GetPosts = async (searchRequest: VM.IPostVM): Promise<any> => {
        try {
            var criteria: any = { userId: { $exists: true } };

            if (!this._.isNil(searchRequest.type)) {
                criteria.type = searchRequest.type
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

    public GetUserProfile = async (userId: string): Promise<VM.IUserProfile> => {
        try {
            var userProfile: any = {};
            var userDetails = await mdbModels.Auth.findOne({ userId: userId }).select("childName city aboutus").exec();
            if (!this._.isNil(userDetails)) {
                var usersPostCount = await mdbModels.Post.count({ userId: userId }).exec();

                userProfile.childName = userDetails.childName;
                userProfile.userId = userId;
                userProfile.aboutYou = userDetails.aboutus;
                userProfile.postCount = usersPostCount;
                userProfile.followersCount = 0;
                userProfile.followingCount = 0;

                if (!this._.isNil(userDetails.city)) {
                    userProfile.city = userDetails.city;
                }
            }
            return userProfile;
        } catch (error) {
            throw error;
        }
    };

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

    public GetQuizzes = async (age: number): Promise<any> => {
        try {
            var ageGroup;

            if (age < 7) {
                ageGroup = "3-7"
            } else if (age >= 7 && age < 11) {
                ageGroup = "7-11"
            } else if (age >= 11 && age <= 16) {
                ageGroup = "11-16"
            }
            var queryResult = await mdbModels.Quizzes.find({ agegroup: ageGroup }).select("title duration agegroup").exec();

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public StartQuiz = async (userId: string, quizId: string): Promise<any> => {
        try {
            var startedQuiz = await mdbModels.Evalution.findOne({ completedAt: { $exists: false }, userId: userId, quizId: quizId }).exec();

            if (!this._.isNil(startedQuiz)) {
                throw `You have not completed the quiz ${quizId}`;
            }

            var quiz = await mdbModels.Quizzes.findOne({ _id: quizId }).exec();

            if (this._.isNil(quiz)) {
                throw `No quiz found with id ${quiz}`;
            }

            var mcqSolutions = quiz.questions.map(x => {
                return <dbTypes.IMCQSolution>{
                    questionId: x._id.toHexString(),
                    status: "skipped"
                };
            });

            var totalScore = quiz.questions.length * 2;

            var evalution = <dbTypes.IEvalution>{
                userId: userId,
                quizId: quizId,
                totalScore: totalScore,
                acquiredScore: 0,
                mcqSolution: mcqSolutions
            };

            var evalutionReport = await mdbModels.Evalution.create(evalution);

            return evalutionReport;
        } catch (error) {
            throw error;
        }
    };

    public GetQuizQuestions = async (quizId: string): Promise<any> => {
        try {
            var queryResult = await mdbModels.Quizzes.find({ _id: quizId }).select("questions").exec()

            return queryResult;
        } catch (error) {
            throw error;
        }
    };

    public UpdateSolutionForQuizQuestion = async (userId: string, quizId: string, questionId: string, submittedInfo: VM.IUpdateQuizAnswer): Promise<any> => {
        try {
            var quizQuestionStatus = "incorrect";

            var quizQuestions = await mdbModels.Quizzes.findOne({ _id: quizId, questions: { $elemMatch: { _id: questionId } } }).select("questions.solution").exec();

            if (!this._.isNil(quizQuestions)) {
                var questions = quizQuestions.questions;

                var solution;

                questions.forEach(x => {
                    solution = x.solution;
                })

                var obj = {};

                if (!this._.isNil(submittedInfo.answer)) {
                    if (solution === submittedInfo.answer) {
                        quizQuestionStatus = "correct";
                    }
                    obj = {
                        "mcqSolution.$.status": quizQuestionStatus,
                        "mcqSolution.$.answer": submittedInfo.answer
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

                var evaluatedQuestion = await mdbModels.Evalution.findOneAndUpdate(
                    {
                        _id: submittedInfo.evalutionId, userId: userId, "mcqSolution.questionId": questionId, quizId: quizId
                    }, obj, {
                        upsert: true, "new": true
                    }).exec();

                return evaluatedQuestion;
            } else {
                throw `No quiz found with Id ${quizId}`;
            }
        } catch (error) {
            throw error;
        }
    };

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

    public GetPostComments = async (postId: string, searchRequest: VM.IPaginate): Promise<any> => {
        try {
            var queryResult = await mdbModels.PostComments.find({ postId: postId })
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
                .select("title")
                .skip(paginate.from)
                .limit(paginate.size)
                .sort({ "createdAt": -1 })
                .exec()

            return query;
        } catch (error) {
            throw error;
        }
    }
}