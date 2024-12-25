import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, checkIsBlocked, waitMiddleware } from "../middlewares/AuthHandler.js";
import { freelancerAllPost, FreelancerForgotPasswordHandler,  FreelancerPasswordResetHandler, FreelancerSignin, FreelancerSignup, FreelancerUpdateUser, getFreelancerProfile, getFreelancerProfileById, sendFreelancerOTP, verifyFreelancerOTP } from "../controllers/FreelancerController.js";

export const freelancerRouter = Router();

freelancerRouter.post("/create", FreelancerSignup);
freelancerRouter.post("/login", FreelancerSignin);
freelancerRouter.put("/update", authFreelancerMiddleware, checkIsBlocked,FreelancerUpdateUser);
freelancerRouter.post("/forgot-password", FreelancerForgotPasswordHandler);
freelancerRouter.post("/reset-password/:token", FreelancerPasswordResetHandler);
freelancerRouter.get("/all-post",freelancerAllPost)
freelancerRouter.get("/profile",authFreelancerMiddleware, checkIsBlocked,getFreelancerProfile)

freelancerRouter.post("/send-otp", sendFreelancerOTP)
freelancerRouter.post("/verify-otp", verifyFreelancerOTP)

freelancerRouter.get("/:id", getFreelancerProfileById);