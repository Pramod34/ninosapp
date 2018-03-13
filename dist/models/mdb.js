"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config = require('config');
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
mongoose.set("debug", true);
var mdbAuthConfig = config.get("mdb-ninosauth");
var reviewHosts = mdbAuthConfig.hosts.join(",");
var authOptions = {
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
var reviewOptions = {
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
}, { timestamps: {}, versionKey: false });
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
});
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
}, { timestamps: {}, versionKey: false });
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
});
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
}, { timestamps: {}, versionKey: false });
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
}, { timestamps: {}, versionKey: false });
var pointsLogSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    sourceId: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        required: false,
        default: 0
    }
}, { timestamps: {}, versionKey: false });
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
}, { timestamps: {}, versionKey: false });
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
}, { timestamps: {}, versionKey: false });
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
}, { versionKey: false });
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
});
exports.mdbModels = {
    Auth: conn.model("Auth", authSchema),
    Post: conn.model("Post", postSchema.index({ title: "text", tags: "text" }, { name: "search-posts-index" })),
    Quizzes: conn.model("Quizzes", quizSchema),
    Evalution: conn.model("Evalution", evalutionSchema),
    PostComments: conn.model("PostComments", postCommentsSchema),
    Challenges: conn.model("Challenges", challengesSchema.index({ title: "text", description: "text", tags: "text" }, { name: "search-challenge-index" })),
    Notifications: conn.model("Notifications", notificationsSchema),
    PointsLog: conn.model("PointsLog", pointsLogSchema)
};
exports.mdbReviewModels = {
    ReportedPosts: conn2.model("ReportedPosts", reportedPostsSchema),
    ReportedPostComments: conn2.model("ReportedPostComments", reportedPostCommentsSchema)
};

//# sourceMappingURL=mdb.js.map
