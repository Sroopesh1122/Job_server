import { Router } from "express";
import { getAllSkills } from "../controllers/SkillsController.js";

export const skillsRouter = Router();


skillsRouter.get("/",getAllSkills)