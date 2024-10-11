import { Router } from "express";
import { addJobPost, addprojectPost,  followCompany,  forgotPasswordHandler, getUser, getUserById, passwordResetHandler, saveJobApplication, signin, signup, unfollowCompany, unSaveJobApplication, updateUser } from "../controllers/UserController.js";
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
UserRouter.post("/job/unsave",authUserMiddleware,unSaveJobApplication);
UserRouter.post("/project",authUserMiddleware,addprojectPost)
UserRouter.post("/company/follow",authUserMiddleware,waitMiddleware,followCompany)
UserRouter.post("/company/unfollow",authUserMiddleware,waitMiddleware,unfollowCompany)
