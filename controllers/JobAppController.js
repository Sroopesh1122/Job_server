import asyncHandler from "express-async-handler";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { providerModal } from "../modals/JobProvider.js";
import { jobCategories } from "../assets/Jobs.js";
import { query } from "express";

export const createJobPost = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    vacancy,
    salary,
    location,
    experience,
    specification,
    qualification,
    must_skills,
    other_skills,
    postedBy,
    job_role,
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
    !experience ||
    !must_skills ||
    !specification ||
    !job_role ||
    !type
  ) {
    throw new Error("All Fields Required!");
  }

  const data = {
    title,
    description,
    vacancy,
    package: salary,
    location,
    specification,
    experience,
    must_skills,
    other_skills,
    postedBy,
    job_role,
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
  const {
    applied_details,
    page = 1,
    limit = 10,
    similar_jobs = false,
    similar_jobs_provider_info = true,
  } = req.query;

  const query = [];
  const matchStage = {};
  matchStage.job_id = id;

  query.push({ $match: matchStage });

  if (applied_details) {
    query.push({
      $lookup: {
        from: "users",
        localField: "applied_ids.userId",
        foreignField: "user_id", // Adjust based on your actual field name in the providers collection
        as: "User_info",
      },
    });

    query.push({
      $project: {
        "User_info.auth_details": 0,
      },
    });
  }

  const findPost = await jobApplicationModal.aggregate(query);
  if (!findPost[0]) {
    // res.status(404)
    throw new Error("Post not found");
  }

  let resdata = {};
  resdata = { job: findPost[0] };

  if (applied_details) {
    resdata.job.User_info = resdata.job.User_info.slice(
      (page - 1) * limit,
      page * limit
    );
  }

  const companyData = await providerModal.findOne(
    { company_id: findPost[0].provider_details },
    { auth_details: 0 }
  );

  if (companyData) {
    resdata = { ...resdata, company: companyData };
  }

  if (similar_jobs) {
    const query_similar = [];
    const matchStage = {};

    matchStage.$or = [];

    // Handle qualification filtering with case insensitivity
    if (resdata?.job?.specification) {
      matchStage.$or.push({
        specification: {
          $regex: resdata?.job?.specification?.join("|"),
          $options: "i",
        },
      });
    }

    // Handle job_role filtering (case insensitive match)
    if (resdata?.job?.job_role) {
      matchStage.$or.push({
        job_role: { $regex: resdata?.job?.job_role, $options: "i" },
      });
    }

    // Handle skills filtering (must_skills or other_skills)
    if (resdata?.job?.must_skills || resdata?.job?.other_skills) {
      const s = [...resdata?.job?.must_skills, ...resdata?.job?.other_skills];
      matchStage.$or.push({
        must_skills: { $regex: s.join("|"), $options: "i" },
      });
      matchStage.$or.push({
        other_skills: { $regex: s.join("|"), $options: "i" },
      });
    }

    query_similar.push({ $match: matchStage });

    if (similar_jobs_provider_info) {
      // Add the lookup stage to join with the providers collection
      query_similar.push({
        $lookup: {
          from: "providers",
          localField: "provider_details",
          foreignField: "company_id", // Adjust based on your actual field name in the providers collection
          as: "provider_info",
        },
      });

      // Unwind the provider_info array if you want a flat structure
      query_similar.push({
        $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true },
      });

      // Project fields and exclude unnecessary ones
      query_similar.push({
        $project: {
          provider_info: {
            auth_details: 0,
          },
        },
      });
    }
    query_similar.push({ $limit: 10 });

    const results = await jobApplicationModal.aggregate([
      ...query_similar,
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          jobs: query_similar, // Paginated jobs data
        },
      },
    ]);

    const pageData = results[0].jobs;
    const removedSearchJOb = pageData?.filter(
      (pdata) => pdata?.job_id !== resdata?.job?.job_id
    );
    resdata = {
      ...resdata,
      similarData: removedSearchJOb || [],
      similar_data_count: removedSearchJOb?.length || 0,
    };
  }

  res.json(resdata);
});

export const getAllJobPost = asyncHandler(async (req, res) => {
  let query = [];

  let {
    qualification,
    q,
    salary,
    userId,
    location,
    job_role,
    specification,
    type,
    provider_details,
    page = 1,
    limit = 10,
    skills,
    minSalary,
    maxSalary,
    suggestion
  } = req.query;

  if (userId) {
    return res.json(
      await jobApplicationModal.find({ "applied_ids.userId": userId })
    );
  }

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

  // Handle job_role filtering (exact match)
  if (job_role) {
    matchStage.job_role = { $regex: job_role, $options: "i" };
  }

  // Handle job_subcategory filtering (exact match)
  if (specification) {
    matchStage.job_specification = {
      $regex: specification.join("|"),
      $options: "i",
    };
  }

 if(suggestion)
 {
  if (req?.user?.profile_details?.skills) {
    const s = req?.user?.profile_details?.skills;
    matchStage.$or = [
      { must_skills: { $regex: s.join("|"), $options: "i" } },
      { other_skills: { $regex: s.join("|"), $options: "i" } },
    ];
  } 
  else
  {
    if (skills) {
      const s = skills.split(",");
      matchStage.$or = [
        { must_skills: { $regex: s.join("|"), $options: "i" } },
        { other_skills: { $regex: s.join("|"), $options: "i" } },
      ];
    }
  }
 }

  if (minSalary && maxSalary) {
    // Handle both min and max salary range
    matchStage["package.min"] = { $gte: parseInt(minSalary) };
    matchStage["package.max"] = { $lte: parseInt(maxSalary) };
  } else if (minSalary) {
    // Handle only min salary case
    matchStage["package.min"] = { $gte: parseInt(minSalary) };
  } else if (maxSalary) {
    // Handle only max salary case
    matchStage["package.max"] = { $lte: parseInt(maxSalary) };
  }
  // Handle type filtering (Full Time, Part Time, etc.)
  if (type) {
    const mode = type.split(",");
    matchStage.type = { $regex: mode.join("|"), $options: "i" }; // Exact match as it's enum
  }

  // Handle provider_details filtering (exact match)
  if (provider_details) {
    matchStage.provider_details = provider_details;
  }

  // Add the match stage to the query pipeline
  query.push({ $match: matchStage });

  query.push({ $sort: { createdAt: -1 } });

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
  query.push({
    $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true },
  });

  query.push({
    $project: {
      provider_info: {
        auth_details: 0,
      },
    },
  });

  const skip = (page - 1) * limit;

  const results = await jobApplicationModal.aggregate(query);

  query.push({ $skip: parseInt(skip) });
  query.push({ $limit: parseInt(limit) });

  const pageData = await jobApplicationModal.aggregate(query);
  res.json({ searchdatas: results.length, pageData });
});

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

export const getSuggestedJobs = asyncHandler(async (req, res) => {
  let query = [];
  const {
    job_role,
    specification,
    page = 1,
    limit = 10,
    skills,
    provider_info = false,
  } = req.query;

  const matchStage = {};

  matchStage.$or = [];

  if (specification) {
    const sp = specification.split(",");
    matchStage.$or.push({
      specification: { $regex: sp.join("|"), $options: "i" },
    });
  }

  if (job_role) {
    matchStage.$or.push({ job_role: { $regex: job_role, $options: "i" } });
  }

  if (skills) {
    const s = skills.split(",");
    matchStage.$or.push({
      must_skills: { $regex: s.join("|"), $options: "i" },
    });
    matchStage.$or.push({
      other_skills: { $regex: s.join("|"), $options: "i" },
    });
  }

  query.push({ $match: matchStage });

  if (provider_info) {
    query.push({
      $lookup: {
        from: "providers",
        localField: "provider_details",
        foreignField: "company_id",
        as: "provider_info",
      },
    });

    query.push({
      $unwind: { path: "$provider_info", preserveNullAndEmptyArrays: true },
    });

    query.push({
      $project: {
        provider_info: {
          auth_details: 0,
        },
      },
    });
  }

  const skip = (page - 1) * limit;

  // Add pagination stages (skip and limit) before querying
  query.push({ $skip: parseInt(skip) });
  query.push({ $limit: parseInt(limit) });

  // Fetch paginated results and total count in a single query
  const results = await jobApplicationModal.aggregate([
    ...query,
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        jobs: query, // Paginated jobs data
      },
    },
  ]);

  const totalResults = results[0]?.totalCount[0]?.count || 0;
  const pageData = results[0].jobs;

  res.json({
    totalResults,
    pageData,
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId, status, user_Id } = req.body;

  const ApllicationStatusDefault = [
    "Applied",
    "Application Viewed",
    "Profile Viewed",
    "Contact Viewed",
    "Resume Viewed",
    "Interested",
  ];

  if (!applicationId || !status || !user_Id) {
    throw new Error("All fields are required");
  }

  // Match the application based on job_id and applied_ids.userId
  const matchStage = {
    job_id: applicationId,
    "applied_ids.userId": user_Id,
  };

  const application = await jobApplicationModal.findOne(matchStage);

  if (!application) {
    throw new Error("Application Not Found");
  }

  if (
    ApllicationStatusDefault?.find((defaultSatuts) => defaultSatuts === status)
  ) {
    application.applied_ids = application?.applied_ids?.map((appData) => {
      if (appData?.userId === user_Id) {
        if (
          !appData?.status?.find(
            (appStatus) => appStatus.toLowerCase() === status.toLowerCase()
          )
        ) {
          appData.status?.push(status);
        }
      }
      return appData;
    });
  }

  await application.save();
  return res.json({ success: true, message: "status changed" });
});

export const getApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId, user_Id } = req.body;

  if (!applicationId || !user_Id) {
    throw new Error("All fields are required");
  }

  // Match the application based on job_id and applied_ids.userId
  const matchStage = {
    job_id: applicationId,
  };

  const application = await jobApplicationModal.findOne(matchStage);

  if (!application) {
    throw new Error("Application Not Found");
  }

  const applicationSatuts = application.applied_ids.find(
    (appData) => appData.userId === user_Id
  );
  if (!applicationSatuts) {
    throw new Error("Applicant not Found");
  }
  return res.json({ applicationStatus: applicationSatuts });
});
