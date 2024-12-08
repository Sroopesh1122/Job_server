import { Router } from "express";
import {
  changeJobApplicationStatus,
  getAllProviders,
  getCompanyTitles,
  getProviderProfileById,
  ProviderForgotPasswordHandler,
  providerGetProfile,
  ProviderPasswordResetHandler,
  providerSignin,
  providerSignup,
  providerUpdateUser,
  sendProviderOTP,
  verifyProviderOTP
} from "../controllers/ProviderController.js";
import { authProviderMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";

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
providerRouter.post("/reset-password/:token", ProviderPasswordResetHandler);
providerRouter.get("/profile", authProviderMiddleware, providerGetProfile);
providerRouter.get("/allcompany",getAllProviders)
providerRouter.get("/searchCompany/:q",getCompanyTitles)
providerRouter.get("/:id", getProviderProfileById);

providerRouter.post("/send-otp", sendProviderOTP);
providerRouter.post("/verify-otp", verifyProviderOTP);