"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var corsMiddleware = require("restify-cors-middleware");
const restify_1 = require("restify");
const log4js_1 = require("log4js");
var config = require('config');
exports.logger = setupLogConfig();
setupRESTService();
function setupRESTService() {
    var serverConfig = config.get("server");
    const server = restify_1.createServer({
        version: "0.0.1"
    });
    server.use(restify_1.bodyParser());
    var cors = corsMiddleware({
        origins: ["*"],
        allowHeaders: ["x-access-token"]
    });
    server.pre(cors.preflight);
    server.use(cors.actual);
    server.use(restify_1.queryParser());
    server.use(restify_1.gzipResponse());
    server.pre((request, response, next) => {
        restify_1.pre.sanitizePath();
        exports.logger.debug(request.method, request.url, " => ", request.headers.host);
        next();
    });
    server.get("/", (req, res, next) => {
        return res.send("Welcome to Ninos App!!!");
    });
    var routes = require("./routes/routes");
    new routes.RoutesManager(server).RegisterRoutes();
    server.listen(serverConfig.port, function () {
        exports.logger.info("=---------------------------------------------------=");
        exports.logger.info("API => http://localhost:%s", serverConfig.port);
        exports.logger.info("=---------------------------------------------------=");
    });
}
function createLogsDir() {
    try {
        require("fs").mkdirSync("./logs");
    }
    catch (e) {
        if (e.code !== "EEXIST") {
            let log = log4js_1.getLogger("app");
            log.error("☹ Could not set up log directory, error was: ", e);
            process.exit(1);
        }
    }
}
function setupLogConfig() {
    createLogsDir();
    log4js_1.configure("./config/log4js.json", {});
    let log = log4js_1.getLogger("app");
    log.debug("✔ Logger initialised");
    return log;
}
process.on("SIGTERM", function () {
    console.log("Goodbye!!!");
});

//# sourceMappingURL=app.js.map
