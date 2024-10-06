import asyncHandler from "express-async-handler";
import { cloudinaryConfiguration } from "../utils/Cloudinary.js";
import fs from 'fs';


export const uploadImage= asyncHandler(async(req,res)=>{
    const file = req.file;
    if(file)
    {
        const {path} = file;
        try {
            const result = await cloudinaryConfiguration.uploader.upload(path,{folder:"profiles"})
            fs.unlinkSync(path);
            res.json(result);
        } catch (error) {
            console.log(error)
            fs.unlinkSync(path);
            throw new Error(error)
        }   
    }
})



export const deleteUploadImg = asyncHandler(async(req,res)=>{

    const {id} = req.body;
    if(id)
    {
        try {
            const result = await cloudinaryConfiguration.uploader.destroy(id);
            res.json({status:true,result});
        } catch (error) {
            throw new Error(error)
        }
        
    }

})