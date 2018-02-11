var neo4j = require("neo4j-driver").v1;
import { get } from "config";

var neoConfig = get<any>("neo4j");
export const driver = neo4j.driver(`bolt://${neoConfig.host}:${neoConfig.port}`, neo4j.auth.basic(`${neoConfig.username}`, `${neoConfig.password}`), { encrypted: false });
