import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";
import { FreelancerForgotPasswordHandler, FreelancerPasswordResetHandler, FreelancerSignin, FreelancerSignup, FreelancerUpdateUser } from "../controllers/FreelancerController.js";

export const freelancerRouter = Router();

freelancerRouter.post("/create", FreelancerSignup);
freelancerRouter.post("/login", FreelancerSignin);
freelancerRouter.put("/update", authFreelancerMiddleware, FreelancerUpdateUser);
freelancerRouter.post("/forgot-password", FreelancerForgotPasswordHandler);
freelancerRouter.post("/reset-password", FreelancerPasswordResetHandler);