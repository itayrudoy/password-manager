import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./auth/auth.routes.js";
import { credentialsRouter } from "./credentials/credentials.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/credentials", credentialsRouter);

  app.use(errorHandler);

  return app;
}
