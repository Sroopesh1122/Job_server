import asyncHandler from "express-async-handler";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { providerModal } from "../modals/JobProvider.js";

export const createProjectPost = asyncHandler(async (req, res) => {
  const { name, description, cost, dueTime } = req.body;
  const { _id, company_id } = req.user;

  if (!name || !description || !cost || !dueTime) {
    throw new Error("All fields Required!!");
  }

  const projectPost = await ProjectApplicationModal.create({
    name,
    description,
    cost,
    dueTime: new Date(),
    provider: company_id,
  });
  if (!projectPost) {
    throw new Error("Project Creation Failed");
  }
  const provider = await providerModal.findOne({company_id});
  provider.project_details.projects.push({projectId:projectPost.project_id});
  await provider.save();
  res.json(projectPost);
});

export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query =[]

  const matchStage = {}

  matchStage.project_id = id;


  query.push({ $match: matchStage });

  query.push({
    $lookup: {
      from: "providers",
      localField: "provider",
      foreignField: "company_id", 
      as: "provider_info",
    },
  });

  query.push({ $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true } });
  query.push({
    $project: {
      provider_info: {
        auth_details: 0, 
      },
    },
  });

  const results = await ProjectApplicationModal.aggregate([...query])

  if (!results || results?.length === 0) {
    throw new Error("Post not Found");
  }
  res.json(results);
});

export const getAllProject = asyncHandler(async (req, res) => {
    const {providerId ,page=1,limit=10} = req.query
    const query=[]
    const matchStage = {};


    if(providerId)
    {
        matchStage.provider = providerId
    }

    query.push({ $match: matchStage });

  query.push({
    $lookup: {
      from: "providers",
      localField: "provider",
      foreignField: "company_id", 
      as: "provider_info",
    },
  });

  query.push({ $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true } });
  query.push({
    $project: {
      provider_info: {
        auth_details: 0, 
      },
    },
  });

  const skip = (page - 1) * limit;

  query.push({ $skip: parseInt(skip) });
  query.push({ $limit: parseInt(limit) });

  const results = await ProjectApplicationModal.aggregate([
    ...query,
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        projects: query, 
      },
    },
  ]);

  const totalResults = results[0]?.totalCount[0]?.count || 0;
  const pageData = results[0].projects;
  res.json({
    totalResults,
    pageData,
  });
});

export const deleteProjectPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id ,company_id } = req.user;

  const findPost = await ProjectApplicationModal.findOne({ project_id: id });
  if (!findPost) {
    throw new Error("Post not Found");
  }
  await findPost.deleteOne();
  const provider = await providerModal.findOne({company_id});

  provider.project_details.projects = provider.project_details.projects.filter((pid) => pid !== id);
  await provider.save();
  res.json({ success: true });
});
