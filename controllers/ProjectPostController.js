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
    dueTime,
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

export const getProjectsSuggestionByText = asyncHandler(async (req, res) => {
  const { q } = req.params;
  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.$or = [
      { name: { $regex: `.*${q.trim()}.*`, $options: "i" } },
      { skills: { $regex: `.*${q.trim()}.*`, $options: "i" } }
    ];
  }

  query.push({ $match: matchStage });

  query.push({
    $project: {
      name: 1,
      skills: 1,
    },
  });

  // Get matching projects
  const results = await ProjectApplicationModal.aggregate(query);

  // Transform results to get unique array of matching strings (names and skills)
  const matchedStrings = results.reduce((acc, item) => {
    if (item.name && new RegExp(q, "i").test(item.name)) {
      acc.add(item.name);
    }
    if (item.skills) {
      item.skills.forEach((skill) => {
        if (new RegExp(q, "i").test(skill)) {
          acc.add(skill);
        }
      });
    }
    return acc;
  }, new Set());

  res.json([...matchedStrings]); 
});

export const getProjectsByText = asyncHandler(async (req, res) => {
  const { q ,limit=10,page=1} = req.query;
  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.$or = [
      { name: { $regex: `.*${q.trim()}.*`, $options: "i" } },
      { skills: { $regex: `.*${q.trim()}.*`, $options: "i" } }
    ];
  }

  query.push({ $match: matchStage });

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


  const results = await ProjectApplicationModal.aggregate(query);

  const skip = (parseInt(page) -1 ) * parseInt(limit);
  let pageData = results.slice(skip, (parseInt(page)*parseInt(limit)))


  return res.json({totalData:results.length , pageData:[...pageData]})
});


export const getAppliedCandidates = asyncHandler(async (req,res)=>{

  const {id ,limit=10,page=1}  = req.query;
  const query = []
  const matchStage = { project_id: id };

  query.push({ $match: matchStage });

  const skip = (parseInt(page) - 1 )* parseInt(limit);
  query.push({
    $addFields: {
      pageData: { $slice: ["$applied_ids", skip, parseInt(limit)] }
    }
  })

  query.push({
    $addFields: {
      reversePagedata: { $reverseArray: "$pageData" }
    }
  })

  query.push({
    $project:{
      applied_ids:0,
      pageData:0
    }
  })

  query.push({ $unwind: { path: "$reversePagedata" } });
  query.push({
    $lookup: {
      from: "users",
      localField: "reversePagedata",
      foreignField: "user_id", 
      as: "candidate_info",
    },
  });

  query.push({
    $project:{
      "candidate_info.auth_details":0,
      "candidate_info.application_applied_info":0,
      "candidate_info.saved_info":0
    }
  })

  query.push({ $unwind: { path: "$candidate_info" } });
  query.push({
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      description: { $first: "$description" },
      cost: { $first: "$cost" },
      dueTime: { $first: "$dueTime" },
      skills: { $first: "$skills" },
      provider: { $first: "$provider" },
      project_id: { $first: "$project_id" },
      candidates: { $push: "$candidate_info" } // Aggregate candidates into an array
    }
  });
  

  const results = await ProjectApplicationModal.aggregate(query);

  return res.json(results)



})

