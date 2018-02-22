var config = require('config');
import mongoose = require("mongoose");
import dbTypes = require("./collections");
mongoose.Promise = require("bluebird");

mongoose.set("debug", true);


var mdbAuthConfig = config.get("mdb-ninosauth");
var reviewHosts = mdbAuthConfig.hosts.join(",");

var authOptions: mongoose.ConnectionOptions = {
    user: mdbAuthConfig.username,
    pass: mdbAuthConfig.password,
    useMongoClient: true
};

if (mdbAuthConfig.replSetName.trim().length > 0) {
    authOptions.replset = { rs_name: mdbAuthConfig.replSetName };
}
var conn = mongoose.createConnection(`mongodb://${reviewHosts}/${mdbAuthConfig.database}?ssl=${mdbAuthConfig.ssl}&authSource=admin`, authOptions);

var mdbReviewConfig = config.get("mdb-ninosreview");
var hosts = mdbReviewConfig.hosts.join(",");

var reviewOptions: mongoose.ConnectionOptions = {
    user: mdbReviewConfig.username,
    pass: mdbReviewConfig.password,
    useMongoClient: true
};

var conn2 = mongoose.createConnection(`mongodb://${hosts}/${mdbReviewConfig.database}?ssl=${mdbReviewConfig.ssl}&authSource=admin`, reviewOptions);


var authSchema = new mongoose.Schema({
    parentName: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    childName: {
        type: String,
        required: true,
        trim: true
    },
    DOB: {
        type: Number,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true
    },
    school: {
        type: String,
        required: false,
        trim: true
    },
    gender: {
        type: String,
        required: false,
        trim: true
    },
    city: {
        type: String,
        required: false,
        trim: true
    },
    state: {
        type: String,
        required: false,
        trim: true
    },
    aboutus: {
        type: String,
        required: false,
        trim: true
    },
    isFirstLogin: {
        type: Boolean,
        required: true
    },
    isEnabled: {
        type: Boolean,
        required: true,
        default: true
    },
    phoneNo: {
        type: Number,
        required: false,
        trim: true
    }
}, { timestamps: {}, versionKey: false });

var postSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: false,
        trim: true
    },
    userName: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        required: false,
        trim: true
    },
    isChallenge: {
        type: Boolean,
        required: false,
        default: false
    },
    challengeTitle: {
        type: String,
        required: false,
        trim: true
    },
    challengeId: {
        type: String,
        required: false,
        trim: true
    },
    tags: {
        type: [String],
        required: false,
        trim: true
    },
    title: {
        type: String,
        required: false,
        trim: true
    },
    totalClapsCount: {
        type: Number,
        required: false,
        default: 0
    },
    totalCommentCount: {
        type: Number,
        required: false,
        default: 0
    },
    isVideo: {
        type: Boolean,
        required: false,
        default: false
    }
}, { timestamps: {}, versionKey: false })

var question = new mongoose.Schema({
    question: {
        type: String,
        required: false,
        trim: true
    },
    options: {
        type: [String],
        required: false,
        trim: true
    },
    solution: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        required: false,
        trim: true
    }
})

var quizSchema = new mongoose.Schema({
    agegroup: {
        type: String,
        required: false,
        trim: true
    },
    duration: {
        type: Number,
        required: false,
        trim: true
    },
    maxage: {
        type: Number,
        required: false,
        trim: true
    },
    minage: {
        type: Number,
        required: false,
        trim: true
    },
    title: {
        type: String,
        required: false,
        trim: true
    },
    questions: [question]
}, { timestamps: {}, versionKey: false })

var mcqsolution = new mongoose.Schema({
    questionId: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: false,
        trim: true
    },
    status: {
        type: String,
        required: true,
        trim: true
    }
})

var evalutionSchema = new mongoose.Schema({
    quizId: {
        type: String,
        required: true,
        trim: true
    },
    totalScore: {
        type: Number,
        required: true,
        trim: true
    },
    acquiredScore: {
        type: Number,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    mcqSolution: [mcqsolution],
    completedDate: {
        type: Date,
        required: false,
        trim: true
    }
}, { timestamps: {}, versionKey: false })

var notificationsSchema = new mongoose.Schema({
    toUserId: {
        type: String,
        required: true,
        trim: true
    },
    notificationType: {
        type: String,
        required: true,
        trim: true
    },
    fromUserId: {
        type: String,
        required: true,
        trim: true
    },
    fromUserName: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false
    }
}, { timestamps: {}, versionKey: false })

var postCommentsSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: {}, versionKey: false })

var challengesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        required: false,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    image: {
        type: String,
        required: false,
        trim: true
    }
}, { timestamps: {}, versionKey: false })

/* ReviewDB Section */

var reportedPostsSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    userReport: {
        type: String,
        required: true,
        trim: true
    },
    reportedDate: {
        type: Date,
        required: true,
        trim: true
    }
}, { versionKey: false })

var reportedPostCommentsSchema = new mongoose.Schema({
    postId: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    userReport: {
        type: String,
        required: true,
        trim: true
    },
    commentId: {
        type: String,
        required: true,
        trim: true
    },
    reportedDate: {
        type: Date,
        required: true,
        trim: true
    }
})

export const mdbModels: dbTypes.INinosDB = {
    Auth: conn.model<dbTypes.IAuth>("Auth", authSchema),
    Post: conn.model<dbTypes.IPost>("Post", postSchema.index({ title: "text", tags: "text" }, { name: "search-posts-index" })),
    Quizzes: conn.model<dbTypes.IQuizzes>("Quizzes", quizSchema),
    Evalution: conn.model<dbTypes.IEvalution>("Evalution", evalutionSchema),
    PostComments: conn.model<dbTypes.IPostComments>("PostComments", postCommentsSchema),
    Challenges: conn.model<dbTypes.IChallenges>("Challenges", challengesSchema.index({ title: "text", description: "text", tags: "text" }, { name: "search-challenge-index" })),
    Notifications: conn.model<dbTypes.INotifications>("Notifications", notificationsSchema)
}

export const mdbReviewModels: dbTypes.INinosReviewDB = {
    ReportedPosts: conn2.model<dbTypes.IReportedPosts>("ReportedPosts", reportedPostsSchema),
    ReportedPostComments: conn2.model<dbTypes.IReportedPostComments>("ReportedPostComments", reportedPostCommentsSchema)
}