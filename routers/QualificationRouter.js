import { Router } from "express";
import { getAllQulification } from "../controllers/QualificationController.js";
import { waitMiddleware } from "../middlewares/AuthHandler.js";

export const qulificationRouter = Router();


qulificationRouter.get("/",waitMiddleware ,getAllQulification);

