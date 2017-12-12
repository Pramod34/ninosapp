"use strict";

var corsMiddleware = require("restify-cors-middleware");
import { createServer, bodyParser, queryParser, Request, gzipResponse, pre } from "restify";
import { configure, getLogger } from "log4js";
var config = require('config');

export const logger: any = setupLogConfig();

setupRESTService();

// starts the server with/without swagger
function setupRESTService() {

    // load settings
    var serverConfig = config.get("server");

    // creating restify server
    const server = createServer({
      version: "0.0.1"
  });

  // include web sockets server.
  server.use(bodyParser());

  var cors = corsMiddleware({
      origins: ["*"],
      allowHeaders: ["x-access-token"]
  });

  server.pre(cors.preflight);
  server.use(cors.actual);

  server.use(queryParser());
  server.use(gzipResponse());
  server.pre((request: Request, response, next) => {
      pre.sanitizePath();
      logger.debug(request.method, request.url, " => ", request.headers.host);
      next();
  });
  server.get("/", (req, res, next) => {
      // var body = ok;
      // res.writeHead(200, {
      //     "Content-Type": "text/html"
      // });
      // res.write(body);
      return res.send("Welcome to Ninos App!!!");
  });

  var routes = require("./routes/routes");

  new routes.RoutesManager(server).RegisterRoutes();

  server.listen(serverConfig.port, function () {
      logger.info("=---------------------------------------------------=");
      logger.info("API => http://localhost:%s", serverConfig.port);
      logger.info("=---------------------------------------------------=");
  });
}


// creates logs dir if it is not available
function createLogsDir() {
  try {
      require("fs").mkdirSync("./logs");

  } catch (e) {
      if (e.code !== "EEXIST") {
          let log = getLogger("app");
          log.error("☹ Could not set up log directory, error was: ", e);
          process.exit(1);
      }
  }
}

// sets up log configurations
function setupLogConfig() {
  createLogsDir();
  configure("./config/log4js.json", {});
  let log = getLogger("app");
  log.debug("✔ Logger initialised");
  return log;
}

process.on("SIGTERM", function () {
  console.log("Goodbye!!!");
});