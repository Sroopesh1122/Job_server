import asyncHandler from "express-async-handler";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { freelancerModel } from "../modals/Freelancer.js";

export const createProjectPost = asyncHandler(async (req, res) => {
  const { name, description, cost, dueTime ,skills } = req.body;
  const { _id, freelancer_id } = req.user;

  if (!name || !description || !cost || !dueTime || !skills) {
    throw new Error("All fields Required!!");
  }

  const projectPost = await ProjectApplicationModal.create({
    name,
    description,
    cost,
    dueTime: new Date(),
    provider: freelancer_id,
    skills
  });
  if (!projectPost) {
    throw new Error("Project Creation Failed");
  }
    const freelancer = await freelancerModel.findById(_id);
    freelancer.project_details.projects.push({projectId:projectPost.project_id});
    await freelancer.save();    
  res.json(projectPost);
});

export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { similar_post, page = 1, limit = 10 } = req.query;

  const query = [];
  const matchStage = { project_id: id };

  query.push({ $match: matchStage });

  query.push({
    $lookup: {
      from: "freelancers",
      localField: "provider",
      foreignField: "freelancer_id", 
      as: "provider_info",
    },
  });

  query.push({ $unwind: { path: "$provider_info" } });
  query.push({
    $project: {
      provider_info: {
        auth_details: 0, 
      },
    },
  });

  const results = await ProjectApplicationModal.aggregate(query);

  if (!results || results.length === 0) {
    throw new Error("Post not Found");
  }

  let pageData = { ...results[0] };

  if (similar_post && pageData.skills) {
    const query_similar = [
      {
        $match: {
          skills: { $in: pageData.skills },
          project_id: { $ne: id }, 
        },
      },
      {
        $lookup: {
          from: "freelancers",
          localField: "provider",
          foreignField: "freelancer_id", 
          as: "provider_info",
        }
      },
      {
        $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true }
      },
      { $sort: { createdAt: -1 } }, 
      { $skip: (page - 1) * limit }, 
      { $limit: parseInt(limit) },
    ];

    const similarPost = await ProjectApplicationModal.aggregate(query_similar);
    pageData = { ...pageData, similarPost };
  }

  res.json(pageData);
});


export const getAllProject = asyncHandler(async (req, res) => {
    const {providerId ,page=1,limit=10,skills,suggestion} = req.query
    const query=[]
    const matchStage = {};


    if(providerId)
    {
        matchStage.provider = providerId
    }

    query.push({ $match: matchStage });
    query.push({$sort:{"createdAt":-1}})

    if(suggestion)
      {
       if (req?.user?.profile_details?.skills) {
         const s = req?.user?.profile_details?.skills;
         matchStage.$or = [
           {skills: { $regex: s.join("|"), $options: "i" } },
         ];
       } 
       else
       {
         if (skills) {
           const s = skills.split(",");
           matchStage.$or = [
             { skills: { $regex: s.join("|"), $options: "i" } },
           ];
         }
       }
      }

  query.push({
    $lookup: {
      from: "freelancers",
      localField: "provider",
      foreignField: "freelancer_id", 
      as: "provider_info",
    },
  });

  query.push({ $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true } });

  query.push({
    $project: {
      "provider_info.auth_details": 0, 
    },
  });

  

  const totalData = await ProjectApplicationModal.aggregate(query);

  const query2=[...query]

  const skip = (page - 1) * limit;

  query2.push({ $skip: parseInt(skip) });
  query2.push({ $limit: parseInt(limit) });

  const results = await ProjectApplicationModal.aggregate(query2);


  return res.json({totalData:totalData?.length , pageData:results})
});

export const deleteProjectPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id ,freelancer_id } = req.user;

  const findPost = await ProjectApplicationModal.findOne({ project_id: id });
  if (!findPost) {
    throw new Error("Post not Found");
  }
  await findPost.deleteOne();
  const provider = await freelancerModel.findOne({freelancer_id});
  provider.project_details.projects = provider.project_details.projects.filter((pid) => pid.projectId !== id);
  await provider.save();
  res.json({ success: true });
});
