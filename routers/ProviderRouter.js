import { Router } from "express";
import {
  changeJobApplicationStatus,
  getAllProviders,
  getProviderProfileById,
  ProviderForgotPasswordHandler,
  providerGetProfile,
  ProviderPasswordResetHandler,
  providerSignin,
  providerSignup,
  providerUpdateUser,
} from "../controllers/ProviderController.js";
import { authProviderMiddleware } from "../middlewares/AuthHandler.js";

export const providerRouter = Router();

providerRouter.post("/create", providerSignup);
providerRouter.post("/login", providerSignin);
providerRouter.put("/update", authProviderMiddleware, providerUpdateUser);
providerRouter.put(
  "/job/status",
  authProviderMiddleware,
  changeJobApplicationStatus
);
providerRouter.post("/forgot-password", ProviderForgotPasswordHandler);
providerRouter.post("/reset-password", ProviderPasswordResetHandler);
providerRouter.get("/profile", authProviderMiddleware, providerGetProfile);
providerRouter.get("/allcompany",getAllProviders)
providerRouter.get("/:id",  getProviderProfileById);

