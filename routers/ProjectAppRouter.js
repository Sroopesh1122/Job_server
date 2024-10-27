import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, getProfileMiddleware } from "../middlewares/AuthHandler.js";
import { createProjectPost, deleteProjectPost, getAllProject, getProject } from "../controllers/ProjectPostController.js";



export const ProjectAppRouter = Router();

ProjectAppRouter.post("/create",authFreelancerMiddleware,createProjectPost);
ProjectAppRouter.get("/:id",getProject);
ProjectAppRouter.get("/",getProfileMiddleware,getAllProject);
ProjectAppRouter.delete("/:id",authFreelancerMiddleware,deleteProjectPost)