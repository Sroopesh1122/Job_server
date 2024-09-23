import { Router } from "express";
import { forgotPasswordHandler, passwordResetHandler, signin, signup, updateUser } from "../controllers/UserController.js";
import { authMiddleware } from "../middlewares/AuthHandler.js";


export const UserRouter = Router();


UserRouter.post("/register",signup)
UserRouter.post("/login",signin)
UserRouter.put("/update",authMiddleware,updateUser)
UserRouter.post("/forgot-password",forgotPasswordHandler);
UserRouter.post("/reset-password/:token",passwordResetHandler);