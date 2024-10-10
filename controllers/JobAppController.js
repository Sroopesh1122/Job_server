import asyncHandler from "express-async-handler";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { providerModal } from "../modals/JobProvider.js";
import { jobCategories } from "../assets/Jobs.js";

export const createJobPost = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    vacancy,
    salary,
    location,
    job_category,
    job_subcategory,
    qualification,
    type,
  } = req.body;
  const { _id, company_id } = req.user;
  if (vacancy === 0 || vacancy < 0) {
    throw new Error("Invalid Vacancy ");
  }
  if (
    !title ||
    !description ||
    !salary ||
    !qualification ||
    !vacancy ||
    !location ||
    !job_category ||
    !job_subcategory ||
    !type
  ) {
    throw new Error("All Fields Required!");
  }

  console.log(company_id);

  const data = {
    title,
    description,
    vacancy,
    package: salary,
    location,
    job_category,
    job_subcategory,
    qualification,
    type,
    provider_details: company_id,
  };

  const jobPost = await jobApplicationModal.create(data);
  if (!jobPost) {
    throw new Error("Job creation Failed");
  }
  const provider = await providerModal.findById(_id);
  if (provider) {
    provider.job_details.jobs.push({ jobId: jobPost.job_id });
    await provider.save();
  }

  res.json(jobPost);
});

export const getJobPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {applied_details,page=1,limit=10}= req.query;

  const query =[];
  const matchStage={};
  matchStage.job_id = id;

  query.push({$match : matchStage})

  if(applied_details)
  {
     query.push({
      $lookup: {
      from: "users",
      localField: "applied_ids.userId",
      foreignField: "user_id", // Adjust based on your actual field name in the providers collection
      as: "User_info",
    }})

    query.push({
      $project:{
        "User_info.auth_details":0
      }
    })
  }

  const findPost = await jobApplicationModal.aggregate(query);
  if (!findPost) {
    throw new Error("Post not found");
  }

  let resdata = {};
  resdata = { job: findPost[0] };


  resdata.job.User_info=  resdata.job.User_info.slice((page-1)*limit ,limit);

  const companyData = await providerModal.findOne(
    { company_id: findPost.provider_details },
    { auth_details: 0 }
  );
  if (companyData) {
    resdata = { ...resdata, company: companyData };
  }

  res.json(resdata);
});


export const getAllJobPost = asyncHandler(async (req, res) => {
  let query = [];

  const {
    qualification, // qualification filter
    q, // search text
    salary, //need to be done
    userId, // salary range or exact salary
    location, // array of locations
    job_category, // category
    job_subcategory, // subcategory
    type, // Full Time, Part Time, etc.
    provider_details, // provider's ID
    page = 1, // pagination - current page
    limit = 10, // pagination - limit per page
  } = req.query;

  if (userId) {
    return res.json(
      await jobApplicationModal.find({ "applied_ids.userId": userId })
    );
  }

  // Build the match stage based on the provided query parameters
  const matchStage = {};

  // Handle text search (title) with case insensitivity
  //i they provide Developer as last word then it will match with every application
  if (q) {
    const words = q.split(" "); // Split the search text into individual words
    matchStage.title = { $regex: words.join("|"), $options: "i" };
  }

  // Handle qualification filtering with case insensitivity
  if (qualification) {
    const qs = qualification.split(",");
    matchStage.qualification = { $regex: qs.join("|"), $options: "i" }; // case-insensitive regex match
  }

  // Handle location filtering (exact match)
  if (location) {
    const ls = location.split(",");
    matchStage.location = { $regex: ls.join("|"), $options: "i" };
  }

  // Handle job_category filtering (exact match)
  if (job_category) {
    matchStage.job_category = { $regex: job_category, $options: "i" };
  }

  // Handle job_subcategory filtering (exact match)
  if (job_subcategory) {
    matchStage.job_subcategory = { $regex: job_subcategory, $options: "i" };
  }

  // Handle type filtering (Full Time, Part Time, etc.)
  if (type) {
    matchStage.type = { $regex: type, $options: "i" }; // Exact match as it's enum
  }

  // Handle provider_details filtering (exact match)
  if (provider_details) {
    matchStage.provider_details = provider_details;
  }

  // Add the match stage to the query pipeline
  query.push({ $match: matchStage });

  // Add the lookup stage to join with the providers collection
  query.push({
    $lookup: {
      from: "providers",
      localField: "provider_details",
      foreignField: "company_id", // Adjust based on your actual field name in the providers collection
      as: "provider_info",
    },
  });

  // Unwind the provider_info array if you want a flat structure
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
  query.push({ $limit: parseInt(limit)});

  const results = await jobApplicationModal.aggregate(query);

  res.json(results);
});

` `

export const deleteJobPost = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { id } = req.params;

  const findPost = await jobApplicationModal.findOne({ job_id: id });
  if (!findPost) {
    throw new Error("Post not Found");
  }
  await findPost.deleteOne();
  const provider = await providerModal.findById(_id);
  provider.job_details.jobs = provider.job_details.jobs.filter(
    (id) => id.jobId !== findPost?.job_id
  );
  await provider.save();
  res.json({ success: true });
});

export const getAllCategoriesAndSubCategories = asyncHandler((req, res) => {
  res.json(jobCategories);
});
