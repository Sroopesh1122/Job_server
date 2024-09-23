import asyncHandler from "express-async-handler";
import { qualifications } from "../assets/Qualification.js";


export const getAllQulification = asyncHandler(async(req,res)=>{
    
    const allQualification  = qualifications;
    res.json(allQualification);

})