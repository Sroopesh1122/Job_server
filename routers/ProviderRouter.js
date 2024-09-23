import { Router } from "express";
import { ProviderForgotPasswordHandler, ProviderPasswordResetHandler, providerSignin, providerSignup, providerUpdateUser } from "../controllers/ProviderController.js";
import { authProviderMiddleware } from "../middlewares/AuthHandler.js";


export const providerRouter  = Router();

providerRouter.post("/create",providerSignup);
providerRouter.post("/login",providerSignin);
providerRouter.put("/update",authProviderMiddleware,providerUpdateUser);
providerRouter.post("/forgot-password",ProviderForgotPasswordHandler);
providerRouter.post("/reset-password",ProviderPasswordResetHandler);

