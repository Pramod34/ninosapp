import { BaseController } from "../../policies/baseController";
export declare class AuthController extends BaseController {
    private authService;
    private secret;
    constructor();
    RegisterFBOrGoogleAccount: (req: any, res: any, next: any) => Promise<any>;
    CheckUserByUserId: (req: any, res: any, next: any) => Promise<any>;
    AddPost: (req: any, res: any, next: any) => Promise<any>;
    GetPosts: (req: any, res: any, next: any) => Promise<any>;
    GetPost: (req: any, res: any, next: any) => Promise<any>;
    UpdatePost: (req: any, res: any, next: any) => Promise<any>;
    GetUserProfile: (req: any, res: any, next: any) => Promise<any>;
    GetUserPublicProfile: (req: any, res: any, next: any) => Promise<any>;
    GetUserDetails: (req: any, res: any, next: any) => Promise<any>;
    UpdateUserDetails: (req: any, res: any, next: any) => Promise<any>;
    GetQuizzes: (req: any, res: any, next: any) => Promise<any>;
    StartQuiz: (req: any, res: any, next: any) => Promise<any>;
    GetQuizQuestions: (req: any, res: any, next: any) => Promise<any>;
    UpdateSolutionForQuizQuestion: (req: any, res: any, next: any) => Promise<any>;
    DeletePost: (req: any, res: any, next: any) => Promise<any>;
    AddPostComment: (req: any, res: any, next: any) => Promise<any>;
    UpdatePostComment: (req: any, res: any, next: any) => Promise<any>;
    DeletePostComment: (req: any, res: any, next: any) => Promise<any>;
    GetPostComments: (req: any, res: any, next: any) => Promise<any>;
    AddPostClaps: (req: any, res: any, next: any) => Promise<any>;
    RemovePostClaps: (req: any, res: any, next: any) => Promise<any>;
}
