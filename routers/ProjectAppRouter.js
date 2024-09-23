import { Router } from "express";
import { authProviderMiddleware } from "../middlewares/AuthHandler.js";
import { createProjectPost, deleteProjectPost, getAllProject, getProject } from "../controllers/ProjectPostController.js";



export const ProjectAppRouter = Router();

ProjectAppRouter.post("/create",authProviderMiddleware,createProjectPost);
ProjectAppRouter.get("/:id",getProject);
ProjectAppRouter.get("/",getAllProject);
ProjectAppRouter.delete("/:id",authProviderMiddleware,deleteProjectPost)