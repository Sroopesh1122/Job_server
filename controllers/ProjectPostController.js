import asyncHandler from "express-async-handler";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { providerModal } from "../modals/JobProvider.js";
import { isValidObjectId } from "mongoose";



export const createProjectPost = asyncHandler(async(req,res)=>{
    const {name,description , cost ,dueTime} = req.body;
    const {_id}  = req.user;

    if(!name ||  !description || !cost || !dueTime)
    {
        throw new Error("All fields Required!!")
    }

    const projectPost = await ProjectApplicationModal.create({name,description,cost,dueTime : new Date()});
    if(!projectPost)
    {
        throw new Error("Project Creation Failed")
    }
    const provider = await providerModal.findById(_id);
    provider.job_details.projects.push(projectPost._id)
    await provider.save();
     
    res.json(projectPost);
})

export const getProject = asyncHandler(async(req,res)=>{
    const {id} = req.params;

    if(!isValidObjectId(id))
    {
        throw new Error("Invalid Id")
    }
     
    const findPost = await ProjectApplicationModal.findById(id);
    if(!findPost)
    {
        throw new Error("Post not Found")
    }
    res.json(findPost);
})

export const getAllProject = asyncHandler(async(req,res)=>{

     
    const findPost = await ProjectApplicationModal.find();
    if(!findPost)
    {
        throw new Error("Post not Found")
    }
    res.json(findPost);
})


export const deleteProjectPost = asyncHandler(async(req,res)=>{
    const {id} = req.params;
    const {_id} = req.user;

    if(!isValidObjectId(id))
    {
        throw new Error("Invalid Id")
    }
     
    const findPost = await ProjectApplicationModal.findById(id);
    if(!findPost)
    {
        throw new Error("Post not Found")
    }
    await findPost.deleteOne();
    const provider = await providerModal.findById(_id);

    provider.job_details.projects = provider.job_details.projects.filter((id)=>id.toString() !== findPost?._id.toString());
    await provider.save();
    res.json({success:true});
})