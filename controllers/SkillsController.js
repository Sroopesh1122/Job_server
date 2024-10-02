import asyncHandler from "express-async-handler";
import { skills } from "../assets/Skills.js";



export const getAllSkills = asyncHandler(async(req,res)=>{
    
    const allSkills  = skills;
    res.json(allSkills);

})