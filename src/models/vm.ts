export namespace VM {
    export interface IPaginate {
        from: number;
        size: number;
    }
    export interface IUserInfo {
        parentName: string;
        childName: string;
        DOB: number;
        school?: string;
        gender?: string;
        city?: string;
        state?: string;
        aboutus?: string;
    }
    export interface IPost {
        userId?: string;
        type: string;
        isChallenge: boolean;
        challengeTitle?: string;
        challengeId?: string;
        tags?: string;
        title?: string;
        isVideo?: boolean;
        userName?: string;
    }

    export interface IUserProfile {
        childName: string,
        userId: string,
        postCount: number,
        followersCount: number,
        followingCount: number;
        aboutYou: string;
        city: string;
    }

    export interface IPostComment {
        userId: string;
        postId: string;
        comment: string;
        userName: string;
    }

    export interface IPostCommentUpdate {
        commentId: string;
        comment: string;
    }

    export interface IUpdateQuizAnswer {
        evalutionId: string;
        answer: string;
    }

    export interface IPostVM extends IPaginate {
        type: string;
        challengeId?: string;
        userId?: string;
    }

    export interface ISearchUser extends IPaginate {
        userName: string;
    }

    export interface ISearch extends IPaginate {
        keyword: string;
    }

    export interface IUserPostReport {
        postId: string;
        userReport: string;
    }

    export interface IUserPostCommentReport {
        postId: string;
        userReport: string;
        commentId: string;
    }

    export interface IMCQSolution {
        questionId: string;
        answer?: string;
        status: string;
    }

    export interface IEvaluateResultParams {
        evalutionId: string;
        mcqSolution: [IMCQSolution]
    }

    export interface IQuizzesVM extends IPaginate {
        userId: string;
        age: number;
    }
}