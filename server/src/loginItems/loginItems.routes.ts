import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { create, getOne, list, remove, update } from "./loginItems.controller.js";

export const loginItemsRouter = Router();

loginItemsRouter.use(requireAuth);

loginItemsRouter.get("/", asyncHandler(list));
loginItemsRouter.post("/", asyncHandler(create));
loginItemsRouter.get("/:id", asyncHandler(getOne));
loginItemsRouter.put("/:id", asyncHandler(update));
loginItemsRouter.delete("/:id", asyncHandler(remove));
