import { Router } from "express";
import { addJobPost, addprojectPost,  followCompany,  forgotPasswordHandler, getAppliedApplication,  getFollowingCompanies,  getSavedApplication , getUser, getUserById, passwordResetHandler, saveJobApplication, signin, signup, unfollowCompany, unSaveJobApplication, updateUser } from "../controllers/UserController.js";
import {  authUserMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";


export const UserRouter = Router();


//profile related

UserRouter.post("/register",signup)
UserRouter.post("/login",signin)
UserRouter.put("/update",authUserMiddleware,updateUser)
UserRouter.post("/forgot-password",forgotPasswordHandler);
UserRouter.post("/reset-password/:token",passwordResetHandler);
UserRouter.get("/profile",authUserMiddleware,waitMiddleware,getUser);
UserRouter.get("/:id",getUserById)
UserRouter.post("/job/apply",authUserMiddleware,waitMiddleware,addJobPost);
UserRouter.post("/job/save",authUserMiddleware,waitMiddleware,saveJobApplication);
UserRouter.get("/job/saved-list",authUserMiddleware,getSavedApplication)
UserRouter.get("/job/applied-list",authUserMiddleware,waitMiddleware,getAppliedApplication)
UserRouter.get("/companies/following",authUserMiddleware,getFollowingCompanies)
UserRouter.post("/job/unsave",authUserMiddleware,waitMiddleware,unSaveJobApplication);
UserRouter.post("/project",authUserMiddleware,addprojectPost)
UserRouter.post("/company/follow",authUserMiddleware,waitMiddleware,followCompany)
UserRouter.post("/company/unfollow",authUserMiddleware,waitMiddleware,unfollowCompany)
