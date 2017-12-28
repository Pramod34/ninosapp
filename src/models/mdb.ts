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
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
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
    }
}, { timestamps: {}, versionKey: false });

var postSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
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
        required: true,
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

export const mdbModels: dbTypes.INinosDB = {
    Auth: conn.model<dbTypes.IAuth>("Auth", authSchema),
    Post: conn.model<dbTypes.IPost>("Post", postSchema),
    Quizzes: conn.model<dbTypes.IQuizzes>("Quizzes", quizSchema),
    Evalution: conn.model<dbTypes.IEvalution>("Evalution", evalutionSchema),
    PostComments: conn.model<dbTypes.IPostComments>("PostComments", postCommentsSchema)
}

