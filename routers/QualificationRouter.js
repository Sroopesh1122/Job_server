import { Router } from "express";
import { getAllQulification } from "../controllers/QualificationController.js";

export const qulificationRouter = Router();


qulificationRouter.get("/",getAllQulification);

