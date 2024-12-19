import { Router } from "express";
import { addJobPost, addprojectPost,  followCompany,  forgotPasswordHandler, getAppliedApplication,  getFollowingCompanies,  getSavedApplication , getUser, getUserById, passwordResetHandler, saveJobApplication, sendUserOtp, signin, signup, unfollowCompany, unSaveJobApplication, updateUser, verifyUserOtp } from "../controllers/UserController.js";
import {  authUserMiddleware, checkIsBlocked, waitMiddleware } from "../middlewares/AuthHandler.js";

export const UserRouter = Router();


//profile related

UserRouter.post("/register",signup)
UserRouter.post("/login",signin)
UserRouter.put("/update",authUserMiddleware, checkIsBlocked,updateUser)
UserRouter.post("/forgot-password",forgotPasswordHandler);
UserRouter.post("/reset-password/:token",passwordResetHandler);
UserRouter.get("/profile",authUserMiddleware,checkIsBlocked,getUser);
UserRouter.get("/:id",getUserById)
UserRouter.post("/job/apply",authUserMiddleware,checkIsBlocked,addJobPost);
UserRouter.post("/job/save",authUserMiddleware,checkIsBlocked,saveJobApplication);
UserRouter.get("/job/saved-list",authUserMiddleware,checkIsBlocked,getSavedApplication)
UserRouter.get("/job/applied-list",authUserMiddleware,checkIsBlocked,getAppliedApplication)
UserRouter.get("/companies/following",authUserMiddleware,checkIsBlocked,getFollowingCompanies)
UserRouter.post("/job/unsave",authUserMiddleware,checkIsBlocked,unSaveJobApplication);
UserRouter.post("/project/apply",authUserMiddleware,checkIsBlocked,addprojectPost)
UserRouter.post("/company/follow",authUserMiddleware,checkIsBlocked,followCompany)
UserRouter.post("/company/unfollow",authUserMiddleware,checkIsBlocked,unfollowCompany)
UserRouter.post("/send-otp", sendUserOtp)
UserRouter.post("/verify-otp", verifyUserOtp)
