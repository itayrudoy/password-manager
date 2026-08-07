import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { create, getOne, list, remove, update } from "./credentials.controller.js";

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth);

credentialsRouter.get("/", asyncHandler(list));
credentialsRouter.post("/", asyncHandler(create));
credentialsRouter.get("/:id", asyncHandler(getOne));
credentialsRouter.put("/:id", asyncHandler(update));
credentialsRouter.delete("/:id", asyncHandler(remove));
