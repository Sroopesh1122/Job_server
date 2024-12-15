import { Router } from "express";
import { addJobPost, addprojectPost,  followCompany,  forgotPasswordHandler, getAppliedApplication,  getFollowingCompanies,  getSavedApplication , getUser, getUserById, passwordResetHandler, saveJobApplication, sendUserOtp, signin, signup, unfollowCompany, unSaveJobApplication, updateUser, verifyUserOtp } from "../controllers/UserController.js";
import {  authUserMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";

export const UserRouter = Router();


//profile related

UserRouter.post("/register",signup)
UserRouter.post("/login",signin)
UserRouter.put("/update",authUserMiddleware,updateUser)
UserRouter.post("/forgot-password",forgotPasswordHandler);
UserRouter.post("/reset-password/:token",passwordResetHandler);
UserRouter.get("/profile",authUserMiddleware,getUser);
UserRouter.get("/:id",getUserById)
UserRouter.post("/job/apply",authUserMiddleware,addJobPost);
UserRouter.post("/job/save",authUserMiddleware,saveJobApplication);
UserRouter.get("/job/saved-list",authUserMiddleware,getSavedApplication)
UserRouter.get("/job/applied-list",authUserMiddleware,getAppliedApplication)
UserRouter.get("/companies/following",authUserMiddleware,getFollowingCompanies)
UserRouter.post("/job/unsave",authUserMiddleware,unSaveJobApplication);
UserRouter.post("/project/apply",authUserMiddleware,addprojectPost)
UserRouter.post("/company/follow",authUserMiddleware,followCompany)
UserRouter.post("/company/unfollow",authUserMiddleware,unfollowCompany)
UserRouter.post("/send-otp", sendUserOtp)
UserRouter.post("/verify-otp", verifyUserOtp)
