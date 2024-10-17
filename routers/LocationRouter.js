import { Router } from "express";
import { getAllLocations } from "../controllers/LocationController.js";
import { waitMiddleware } from "../middlewares/AuthHandler.js";

export const LocationRouter = Router();


LocationRouter.get("/",waitMiddleware ,getAllLocations);

