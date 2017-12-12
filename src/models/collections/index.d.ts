import { Document, Model } from "mongoose";

export interface INinosDB {
    Auth: Model<IAuth>;
    Post: Model<IPost>;
    Quizzes: Model<IQuizzes>;
    Evalution: Model<IEvalution>;
    PostComments: Model<IPostComments>;

}

//incomplete one
export interface IPost extends Document {
    userId: string;
    type: string;
    isChallenge: boolean;
    challengeTitle?: string;
    challengeId?: string;
    tags?: string;
    title?: string;
    totalClapsCount: number;
    totalCommentCount: number;
}

export interface IAuth extends Document {
    parentName: string;
    userId: string;
    childName: string;
    DOB: number;
    email: string;
    school?: string;
    gender?: string;
    city?: string;
    state?: string;
    aboutus?: string;
    isFirstLogin: boolean;
    isEnabled: boolean;
}

export interface IQuizzes extends Document {
    agegroup: string;
    duration: number;
    maxage: number;
    minage: number;
    title: string;
    questions: [IQuestion]
}

export interface IQuestion extends Document {
    question: string;
    options: [string];
    solution: string;
    type: string;
}

export interface IMCQSolution {
    questionId: string;
    answer?: string;
    status: string;
}

export interface IEvalution extends Document {
    quizId: string;
    totalScore: number;
    acquiredScore: number;
    userId: string;
    mcqSolution: [IMCQSolution];
    completedDate: Date;
}

export interface IPostComments extends Document {
    postId:string;
    userId:string;
    userName:string;
    comment:string;
}