import { Router } from "express";
import {  deleteNotification, getAllNotification, readNotification } from "../controllers/NotificationControoler.js";
import { waitMiddleware } from "../middlewares/AuthHandler.js";

export const notificationRouter = Router();


notificationRouter.put("/read",readNotification)
notificationRouter.get("/",getAllNotification);
notificationRouter.delete("/",deleteNotification)


