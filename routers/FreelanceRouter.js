import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";
import { freelancerAllPost, FreelancerForgotPasswordHandler,  FreelancerPasswordResetHandler, FreelancerSignin, FreelancerSignup, FreelancerUpdateUser, getFreelancerProfile } from "../controllers/FreelancerController.js";

export const freelancerRouter = Router();

freelancerRouter.post("/create", FreelancerSignup);
freelancerRouter.post("/login", FreelancerSignin);
freelancerRouter.put("/update", authFreelancerMiddleware, FreelancerUpdateUser);
freelancerRouter.post("/forgot-password", FreelancerForgotPasswordHandler);
freelancerRouter.post("/reset-password", FreelancerPasswordResetHandler);
freelancerRouter.get("/all-post",freelancerAllPost)
freelancerRouter.get("/profile",authFreelancerMiddleware,getFreelancerProfile)