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


// export const uploadResume = asyncHandler(async (req, res) => {
//     const file = req.file;
  
//     if (file) {
//       const { path } = file;  
//         res.json({
//           success: true,
//           url: path,
//           id: req.resume_id  
//         });   
//   }});


export const uploadResume = asyncHandler(async (req, res) => {
    const file = req.file;
  
    if (file) {
      const { path } = file;  
      try {
        const result = await cloudinaryConfiguration.uploader.upload(path, {
          folder: "resumes",     
          resource_type: "raw",  
        });
  
        fs.unlinkSync(path);

       
  
        res.json({
          success: true,
          message: "Resume uploaded successfully!",
          url: result.secure_url,
          result:result, 
          fileName:file.originalname
        });
  
      } catch (error) {
        
        console.error(error);
        fs.unlinkSync(path); 
        res.status(500).json({
          success: false,
          message: "File upload failed",
          error: error.message,
        });
      }
    } else {
      throw new Error("Failed to upload")
    }
  });

//   export const deleteResume = asyncHandler(async (req, res) => {
     
//      const {url} = req.body
//     try {
//         fs.unlinkSync(url);
//         res.json({success:true});
//     } catch (error) {
       
//         throw new Error(error)
//     } 
// });

export const deleteResume = asyncHandler(async(req,res)=>{

    const {id} = req.body;
    if(id)
    {
        try {
            const result = await cloudinaryConfiguration.uploader.destroy(id ,{
                resource_type: "raw",  // Make sure it's set to "raw" for non-image files like PDFs
              });
            res.json({status:true,result});
        } catch (error) {
            throw new Error(error)
        }
        
    }

})