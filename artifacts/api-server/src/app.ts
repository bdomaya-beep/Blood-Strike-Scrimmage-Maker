import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { type IncomingMessage, type ServerResponse } from "node:http";
import { createRequire } from "node:module";
import router from "./routes";
import { logger } from "./lib/logger";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http") as typeof import("pino-http").default;
const sessionSecret = process.env.SESSION_SECRET?.trim();
const isProduction = process.env.NODE_ENV === "production";
const isDefaultSessionSecret = !sessionSecret || sessionSecret === "blood-strike-secret";

if (isDefaultSessionSecret && isProduction) {
  throw new Error("SESSION_SECRET must be set to a secure value in production.");
}

if (isDefaultSessionSecret && !isProduction) {
  logger.warn(
    "Using default SESSION_SECRET for local development. Set SESSION_SECRET in .env for safer local sessions.",
  );
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(sessionSecret || "blood-strike-secret"));

app.use("/api", router);

export default app;
