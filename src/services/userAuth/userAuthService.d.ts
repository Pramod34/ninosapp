import dbTypes = require("../../models/collections");
import { BaseService } from "../../policies/baseService";
import { VM } from "../../models/vm";
export declare class UserAuthService extends BaseService {
    private rF;
    private usersLastLogin;
    private postClapsByUser;
    private reportPostsByUser;
    private reportPostCommentByUser;
    constructor();
    CheckUser: (userId: string) => Promise<any>;
    CreateUser: (userInfo: dbTypes.IAuth) => Promise<any>;
    SetUserLastLogin: (userId: string) => Promise<void>;
    AddPost: (userPost: VM.IPost) => Promise<any>;
    GetPosts: (searchRequest: VM.IPostVM, userId: string) => Promise<any>;
    GetPost: (postId: string) => Promise<any>;
    UpdatePost: (updatePostDetails: VM.IPost, postId: string) => Promise<any>;
    GetUserProfile: (userId: string) => Promise<VM.IUserProfile>;
    GetUserDetails: (userId: any) => Promise<any>;
    UpdateUserDetails: (userId: string, userInfo: VM.IUserInfo) => Promise<any>;
    GetUserAge: (dob: number) => number;
    GetQuizzes: (age: number) => Promise<any>;
    StartQuiz: (userId: string, quizId: string) => Promise<any>;
    GetQuizQuestions: (quizId: string) => Promise<any>;
    UpdateSolutionForQuizQuestion: (userId: string, quizId: string, questionId: string, submittedInfo: VM.IUpdateQuizAnswer) => Promise<any>;
    EvaluateQuizResult: (userId: string, quizId: string, evaluateResultDetails: VM.IEvaluateResultParams) => Promise<any>;
    GetUserEvaluationResult: (userId: string, quizId: string) => Promise<any>;
    GetPostAuthorID: (postId: string) => Promise<any>;
    DeletePost: (postId: string, userId: string) => Promise<any>;
    AddPostComment: (postComment: VM.IPostComment) => Promise<any>;
    UpdatePostCommentCount: (postId: string, count: number) => Promise<any>;
    UpdateClapsCountForPost: (postId: string, count: number) => Promise<any>;
    UpdatePostComment: (postId: string, userId: string, updatePostComment: VM.IPostCommentUpdate) => Promise<any>;
    DeletePostComment: (commentId: string, postId: string, userId: string) => Promise<any>;
    GetPostComments: (postId: string, searchRequest: VM.IPaginate, userId: string) => Promise<any>;
    AddPostClaps: (postId: string, userId: string) => Promise<any>;
    GetClapsForPostCount: (postId: string) => Promise<any>;
    RemovePostClaps: (postId: string, userId: string) => Promise<any>;
    GetUserClaps: (userId: string, postId: string) => Promise<any>;
    GetChallenges: (paginate: VM.IPaginate) => Promise<any>;
    GetChallenge: (challengeId: string) => Promise<any>;
    GetUsers: (searchUserObj: VM.ISearchUser) => Promise<any>;
    SearchPosts: (searchPosts: VM.ISearch) => Promise<any>;
    SearchChallenge: (SearchChallenge: VM.ISearch) => Promise<any>;
    UserReportOnPost: (userId: string, reportDetails: VM.IUserPostReport) => Promise<any>;
    GetUserReportedPosts: (userId: string) => Promise<any>;
    UserReportOnPostComment: (userId: string, postCommentReport: VM.IUserPostCommentReport) => Promise<any>;
    GetUserReportedPostComments: (userId: string, postId: string) => Promise<any>;
    isQuizTaken: (userId: string, quizId: string) => Promise<any>;
}
