import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, getProfileMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";
import { createProjectPost, deleteProjectPost, getAllProject, getProject, getProjectsByText, getProjectsSuggestionByText } from "../controllers/ProjectPostController.js";



export const ProjectAppRouter = Router();

ProjectAppRouter.post("/create",authFreelancerMiddleware,createProjectPost);
ProjectAppRouter.get("/project/search",waitMiddleware,getProjectsByText)
ProjectAppRouter.get("/search/:q",waitMiddleware,getProjectsSuggestionByText)
ProjectAppRouter.get("/:id",waitMiddleware,getProject);
ProjectAppRouter.get("/",getProfileMiddleware,getAllProject);
ProjectAppRouter.delete("/:id",authFreelancerMiddleware,deleteProjectPost)