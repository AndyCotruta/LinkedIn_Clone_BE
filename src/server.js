import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";

import {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";

import usersRouter from "./api/users/index.js";
import postsRouter from "./api/posts/index.js";
import filesRouter from "./api/files/index.js";
import requestsRouter from "./api/requests/index.js";
// import experienceRouter from "./api/experience/index.js";

const server = express();
const port = process.env.PORT;

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

const corsOpts = {
  origin: (origin, corsNext) => {
    console.log("CURRENT ORIGIN", origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      corsNext(null, true);
    } else {
      corsNext(
        createHttpError(400, `Origin ${origin} is not in the whitelist`)
      );
    }
  },
};
server.use(cors());
server.use(express.json());

server.use("/users", usersRouter);
server.use("/posts", postsRouter);
server.use("/files", filesRouter);
server.use("/requests", requestsRouter);
// server.use("/experiences", experienceRouter);

server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

mongoose.connect(process.env.MONGODB_URL);

mongoose.connection.on("connected", () => {
  console.log("Connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server), console.log(`Server port is ${port}`));
  });
});
