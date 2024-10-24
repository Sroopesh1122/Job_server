import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import { providerModal } from "../modals/JobProvider.js";
import { jobApplicationModal } from "../modals/JobApplication.js";

export const providerSignup = asyncHandler(async (req, res) => {
  const { email, password, company_name } = req.body;

  if (!email || !password || !company_name) {
    throw new Error("All Fields Required!!");
  }
  try {
    const findUser = await providerModal.findOne({"email": email });
    if (findUser) {
      throw new Error("Email Already Exists");
    }
    const data = {
       company_name, email ,
      auth_details: { password },
    };
    const user = await providerModal.create(data);

    const resdata = {
      userId: user.company_id,
      docId: user._id
    };

    if (user) {
      res.json({ authToken : await jwt.sign(resdata,process.env.JWT_SECRET_TOKEN)});
    } else {
      throw new Error("Account Creation Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const providerSignin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new Error("All Fields Required!!");
  }
  try {
    const user = await providerModal.findOne({ "email": email });
    if (!user) {
      throw new Error("Account Not found");
    }

    if (!(await user.isPasswordMatched(password))) {
      throw new Error("Incorrect password");
    }

    const resdata = {
      userId: user.company_id,
      docId: user._id
    };

    res.json(await jwt.sign(resdata,process.env.JWT_SECRET_TOKEN));
  } catch (error) {
    throw new Error(error);
  }
});

export const providerUpdateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await providerModal.findByIdAndUpdate(_id, req.body ,{new:true});
    if (user) {
      res.json(user);
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});



export const ProviderForgotPasswordHandler = asyncHandler(async(req,res)=>{
  const { email } = req.body;
  if(!email)
  {
    throw new Error("Email required!!")
  }
  try {
    const user = await providerModal.findOne({"email":email});
    if(!user)
    {
      throw new Error("Account Not Found");
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    if (user) {
      res.json({resetToken});
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
})


export const ProviderPasswordResetHandler = asyncHandler(async(req,res)=>{

  
  
  const {token} = req.params;
  const {password} = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  try {
    const user = await providerModal.findOne({"auth_details.passwordResetToken":hashedToken});
    if(!user)
    {
      throw new Error("Invalid token");
    }
    if(Date.now() >  user.auth_details.passwordResetExpiresAt)
    {
      throw new Error("Token expired! ,Try Again later")
    }
    user.auth_details.password = password;
    user.auth_details.passwordResetToken = undefined
    user.auth_details.passwordResetExpiresAt = undefined;
    await user.save();
    if (user) {
      res.json({user});
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
})


export const providerGetProfile= asyncHandler(async(req,res)=>{
  const {_id} = req.user;

  const findAccount  = await providerModal.findById(_id);
  if(!findAccount)
  {
    throw new Error("Account Not found");
  }
  return res.json(findAccount);
})

export const getProviderProfileById= asyncHandler(async(req,res)=>{
  const {id} = req.params;

  const query =[];

  const matchStage = {};

  matchStage.company_id = id;


  query.push({$match : matchStage})

  query.push({
    $lookup: {
      from: "applications",
      localField: "job_details.jobs.jobId",
      foreignField: "job_id", // Adjust based on your actual field name in the providers collection
      as: "Applications_info",
    },
  });

  const findAccount = await providerModal.aggregate(query)
  if(!findAccount)
  {
    throw new Error("Account Not found");
  }
    return res.json({accountData : findAccount[0]});
})

export const getAllProviders = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, q } = req.query;

  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.company_name = { $regex: `.*${q.trim()}.*`, $options: "i" };
  }

  // Match stage
  query.push({ $match: matchStage });

  // Project stage: Exclude auth_details
  query.push({
    $project: {
      auth_details: 0,
    },
  });

  // Duplicate query array for total count
  const totalResultsQuery = [...query];

  // Add $count for total results count
  totalResultsQuery.push({
    $count: "totalResults",
  });

  // Get total number of results
  const totalResultsData = await providerModal.aggregate(totalResultsQuery);
  const totalResults = totalResultsData.length > 0 ? totalResultsData[0].totalResults : 0;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  query.push({ $skip: parseInt(skip) });
  query.push({ $limit: parseInt(limit) });

  // Fetch paginated results
  const results = await providerModal.aggregate(query);
  res.json({ totalDatas: totalResults, pageData: results });
});

export const getCompanyTitles = asyncHandler(async (req, res) => {
  const { q } = req.params;


  console.log(q)

  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.company_name = { $regex: `.*${q.trim()}.*`, $options: "i" };
  }

  query.push({ $match: matchStage });

  query.push({
    $project: {
      company_name: 1,
    },
  });

  // Duplicate query array for total count
  const totalResultsQuery = [...query];

  // Get total number of results
  const totalResultsData = await providerModal.aggregate(totalResultsQuery);
  res.json(totalResultsData)
});

export const changeJobApplicationStatus = asyncHandler(async(req,res)=>{

  const {_id ,company_id} = req.user;

  const { applicationId ,status ,user} = req.body;

  if(!applicationId || !status || !user)
  {
    throw new Error("ApplicationId Or status Or userId is Required!!");
  }

  const findPost = await jobApplicationModal.findOne({job_id : applicationId});
  if(!findPost)
  {
    throw new Error("Application Post not found!!")
  }

  if(findPost.provider_details !== company_id)
  {
    throw new Error("Only Auth user can access")
  }

  if(await jobApplicationModal.findOne({job_id : applicationId , "applied_ids.userId":user}))
  {
    if(await jobApplicationModal.findOneAndUpdate({job_id : applicationId , "applied_ids.userId":user},{$set: { "applied_ids.$.status": status }},{new:true}))
    {
      res.json({success:true})
    }
   
  }
  else{
    throw new Error("Applicant not found")
  }
})
