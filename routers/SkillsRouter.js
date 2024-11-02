import { Router } from "express";
import { getAllSkills } from "../controllers/SkillsController.js";
import { waitMiddleware } from "../middlewares/AuthHandler.js";

export const skillsRouter = Router();


skillsRouter.get("/",getAllSkills) 