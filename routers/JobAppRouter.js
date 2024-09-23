import { Router } from "express";
import { authProviderMiddleware } from "../middlewares/AuthHandler.js";
import { createJobPost, deleteJobPost, getAllJobPost, getJobPost } from "../controllers/JobAppController.js";


export const JobAppRouter = Router();


JobAppRouter.post("/create",authProviderMiddleware ,createJobPost);
JobAppRouter.delete("/:id",authProviderMiddleware,deleteJobPost);
JobAppRouter.get("/:id", getJobPost);
JobAppRouter.get("/",getAllJobPost);
