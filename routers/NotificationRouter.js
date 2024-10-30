import { Router } from "express";
import {  getAllNotification, readNotification } from "../controllers/NotificationControoler.js";
import { waitMiddleware } from "../middlewares/AuthHandler.js";

export const notificationRouter = Router();


notificationRouter.put("/read",waitMiddleware,readNotification)
notificationRouter.get("/",getAllNotification);


