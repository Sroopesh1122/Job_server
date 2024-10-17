import asyncHandler from "express-async-handler";
import { allLocations } from "../assets/locations.js";

export const getAllLocations = asyncHandler(async(req,res)=>{
    const Locations  = allLocations;
    res.json(Locations);
});