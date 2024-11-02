import { Router } from "express";
import { authFreelancerMiddleware, authProviderMiddleware, getProfileMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";
import { createProjectPost, deleteProjectPost, getAllProject, getAppliedCandidates, getProject, getProjectsByText, getProjectsSuggestionByText } from "../controllers/ProjectPostController.js";



export const ProjectAppRouter = Router();

ProjectAppRouter.post("/create",authFreelancerMiddleware,createProjectPost);
ProjectAppRouter.get("/apply-candidate",getAppliedCandidates)
ProjectAppRouter.get("/project/search",getProjectsByText)
ProjectAppRouter.get("/search/:q",getProjectsSuggestionByText)
ProjectAppRouter.get("/:id",getProject);
ProjectAppRouter.get("/",getProfileMiddleware,getAllProject);
ProjectAppRouter.delete("/:id",authFreelancerMiddleware,deleteProjectPost)