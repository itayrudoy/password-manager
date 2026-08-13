import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getVaultKey } from "./keychain.controller.js";

export const keychainRouter = Router();

keychainRouter.use(requireAuth);

keychainRouter.get("/vault-key", asyncHandler(getVaultKey));
