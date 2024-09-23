import { Router } from "express";
import { forgotPasswordHandler, getUser, getUserById, passwordResetHandler, signin, signup, updateUser } from "../controllers/UserController.js";
import {  authUserMiddleware } from "../middlewares/AuthHandler.js";


export const UserRouter = Router();


UserRouter.post("/register",signup)
UserRouter.post("/login",signin)
UserRouter.put("/update",authUserMiddleware,updateUser)
UserRouter.post("/forgot-password",forgotPasswordHandler);
UserRouter.post("/reset-password/:token",passwordResetHandler);
UserRouter.get("/profile",authUserMiddleware,getUser);
UserRouter.get("/:id",getUserById)