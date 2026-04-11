"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const app_1 = require("./app");
const server = (0, node_http_1.createServer)(app_1.app);
const start = async () => {
    await database_1.prisma.$connect();
    server.listen(env_1.env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Backend server listening on http://localhost:${env_1.env.port}`);
    });
};
void start();
