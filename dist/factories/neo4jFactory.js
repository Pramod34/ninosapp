"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var neo4j = require("neo4j-driver").v1;
const config_1 = require("config");
var neoConfig = config_1.get("neo4j");
exports.driver = neo4j.driver(`bolt://${neoConfig.host}:${neoConfig.port}`, neo4j.auth.basic(`${neoConfig.username}`, `${neoConfig.password}`), { encrypted: false });

//# sourceMappingURL=neo4jFactory.js.map
