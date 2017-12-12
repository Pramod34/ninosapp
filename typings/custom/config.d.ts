declare module "config"
{
    interface IFeedMappings {
        host: string;
        feedIndex: string;
        postType: string;
        questionType: string;
    }
    interface IStenMainMappings {
        host: string;
        postIndex: string;
        postType: string;
        questionType: string;
        postCommentType: string;
        postletType: string;
    }

    export interface IActivityMappings {
        host: string;
        userIndex: string;
        userNotificationType: string;
        userActivityLogType: string;
    }

    export interface IBackupArticleMappings {
        host: string;
        backupIndex: string;
        articleBackupType: string;
    }

    export interface IStudyGuideMappings {
        host: string;
        studyGuideIndex: string;
        studyGuideType: string;
    }

    export interface IMongoDBServer {
        database: string;
        hosts: Array<String>
        username: string;
        password: string;
        replSetName: string
        ssl: string;
    }

    export interface IKafkaConfig {
        hosts: string;
        creationTopic: string;
        updationTopic: string;
    }

    export interface IRedisServer {
        counterDb: number
        host: string;
        password: string;
        port: string
    }

    export interface IRedisDBs {
        dbDataCollections: string
        dbPost: string
        dbReportPost: string
        dbSocket: string
        dbUser: string
        userCourseState: string
        dbSuggestion: string;
    }

    export interface INeo4JServer {
        host: string;
        password: string;
        port: string;
        username: string;
    }

    export interface IServerDetails {
        assessmentPort: number;
        cluster: boolean;
        port: number;
        taskQueuePort: number;
    }

    export interface IAppDetails {
        assessmentUrl: string;
        name: string;
        sn: string;
        url: string;
    }
    export interface ISiteUrls {
        assessments: string;
        colleges: string;
        lms: string;
        main: string;

    }
}
