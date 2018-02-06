export declare namespace VM {
    interface IPaginate {
        from: number;
        size: number;
    }
    interface IUserInfo {
        parentName: string;
        childName: string;
        DOB: number;
        school?: string;
        gender?: string;
        city?: string;
        state?: string;
        aboutus?: string;
    }
    interface IPost {
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
    interface IUserProfile {
        childName: string;
        userId: string;
        postCount: number;
        followersCount: number;
        followingCount: number;
        aboutYou: string;
        city: string;
    }
    interface IPostComment {
        userId: string;
        postId: string;
        comment: string;
        userName: string;
    }
    interface IPostCommentUpdate {
        commentId: string;
        comment: string;
    }
    interface IUpdateQuizAnswer {
        evalutionId: string;
        answer: string;
    }
    interface IPostVM extends IPaginate {
        type: string;
        challengeId?: string;
        userId?: string;
    }
    interface ISearchUser extends IPaginate {
        userName: string;
    }
    interface ISearch extends IPaginate {
        keyword: string;
    }
    interface IUserPostReport {
        postId: string;
        userReport: string;
    }
    interface IUserPostCommentReport {
        postId: string;
        userReport: string;
        commentId: string;
    }
    interface IMCQSolution {
        questionId: string;
        answer?: string;
        status: string;
    }
    interface IEvaluateResultParams {
        evalutionId: string;
        mcqSolution: [IMCQSolution];
    }
}
