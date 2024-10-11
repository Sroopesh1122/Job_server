import asyncHandler from "express-async-handler";
import userModal from "../modals/User.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import { jobApplicationModal } from "../modals/JobApplication.js";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { isValidObjectId } from "mongoose";
import { sendMail } from "../utils/MailSender.js";
import { providerModal } from "../modals/JobProvider.js";

export const signup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    throw new Error("All Fields Required!!");
  }

  try {
    const findUser = await userModal.findOne({"email": email });
    if (findUser) {
      throw new Error("Email Already Exists");
    }
    const data = {
       name, email ,
      auth_details: { password },
    };
    const user = await userModal.create(data);
    const resdata = {
      userId: user.user_id,
      docId: user._id
    };
    if (user) {
      res.json({user , auth_tokens:await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN)});
    } else {
      throw new Error("Account Creation Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new Error("All Fields Required!!");
  }
  try {
    const user = await userModal.findOne({ "email": email });
    if (!user) {
      throw new Error("Account Not found");
    }
    if (!(await user.isPasswordMatched(password))) {
      throw new Error("Incorrect password");
    }

    const resdata = {
      userId: user.user_id,
      docId: user._id
    };



    res.json(await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN));
  } catch (error) {
    throw new Error(error);
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await userModal.findByIdAndUpdate(_id, req.body ,{new:true});
    if (user) {
      res.json(user);
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});





export const getUser = asyncHandler(async(req,res)=>{
  const {_id} = req.user;
  const findUser = await userModal.findById(_id);
  if(!findUser)
  {
    throw new Error("User Not Found")
  }
  return res.json(findUser);
})


export const getUserById = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  let findUser = await userModal.findOne({user_id : id});
  if(!findUser)
  {
        throw new Error("User Not Found")
    
    }
  return res.json(findUser);
})


export const forgotPasswordHandler = asyncHandler(async(req,res)=>{
  const { email } = req.body;
  if(!email)
  {
    throw new Error("Email required!!")
  }
  try {
    const user = await userModal.findOne({"email":email});
    if(!user)
    {
      throw new Error("Account Not Found");
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    if (user) {
      const resetURL = `Hi ,Please follow this link to reset your password . This is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${resetToken}'>Click now</a>`;
    const data = {
      to: email,
      text: "Hey user",
      subject: "Forgot passowrd (Reset Password)",
      htm: resetURL,
    };
      try {
        await sendMail(data);
      } catch (error) {
        console.log(error)
      }
      res.json({resetToken});
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
})


export const passwordResetHandler = asyncHandler(async(req,res)=>{
  const {token} = req.params;
  const {password} = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
  try {
    const user = await userModal.findOne({"auth_details.passwordResetToken":hashedToken });
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



// add job and project frunctionality



export const addJobPost = asyncHandler(async(req,res)=>{
  const {_id ,user_id} = req.user;
  const { applicationId } = req.body;
  if(!applicationId)
  {
      throw new Error("Application is Required!!");
  }
  const findPost = await jobApplicationModal.findOne({job_id : applicationId});
  if(!findPost)
  {
    throw new Error("Application Post not found!!")
  }
  //adding applied user details to application
  if(await jobApplicationModal.findOne({"applied_ids.userId" : user_id , job_id : applicationId}))
  {
    throw new Error("Already applied for this post");
  }

  findPost.applied_ids.push({userId:user_id,status:"Applied"});
  await findPost.save();
  const user = await userModal.findById(_id);
  user.application_applied_info.jobs.push({jobId: applicationId});
  await user.save();
  res.json({success:true , applied_list : [...user.application_applied_info.jobs]});

})


export const addprojectPost = asyncHandler(async(req,res)=>{
  const {_id} = req.user;
  const {postId } = req.body;
  if(!postId)
  {
    throw new Error("All fields Required");
  }
  if(!isValidObjectId(postId))
    {
      throw new Error("Invalid Id")
    }

  const findPost = await ProjectApplicationModal.findById(postId);
  if(!findPost)
  {
    throw new Error("Post not found!!")
  }
  if(findPost.applied_ids.find((i)=>i.toString() === _id.toString()))
    {
      throw new Error("Already applied for this post");
    }
  findPost.applied_ids.push(_id);
  await findPost.save();
  const user = await userModal.findById(_id);
  user.application_applied_info.projects.push(postId);
  await user.save();
  res.json({success:true});
})


export const followCompany = asyncHandler(async(req,res)=>{
  const {companyId} = req.body;
  const {user_id} = req.user;

  if(!companyId)
  {
    throw new Error("Company Id required!!")
  }
  
  const company =  await providerModal.findOne({company_id:companyId});
  if(!company)
  {
    throw new Error("Company Not Found!");
  }

  if(company.followers.find((id)=> id ===user_id))
  {
    throw new Error("Already following");
  }

  company.followers.push(user_id);
  const user = await userModal.findOne({user_id:user_id})
  user.follwing.push(company.company_id);
  await user.save()
  await company.save();
  return res.json({"success":true})
})

export const unfollowCompany = asyncHandler(async(req,res)=>{
  const {companyId} = req.body;
  const {user_id} = req.user;

  if(!companyId)
  {
    throw new Error("Company Id required!!")
  }
  
  const company =  await providerModal.findOne({company_id:companyId});
  if(!company)
  {
    throw new Error("Company Not Found!");
  }

  if(company.followers.find((id)=> id !== user_id))
    {
      throw new Error("user id not found");
    }
  
  company.followers =  company.followers.filter((id)=>id !== user_id);
  const user = await userModal.findOne({user_id:user_id});
  user.follwing = user.follwing.filter((id)=>id !== companyId);
  await user.save();
  await company.save();
  return res.json({"success":true})
})


export const saveJobApplication = asyncHandler(async(req,res)=>{
  const {jobId} = req.body;
  const {user_id} = req.user;

  if(!jobId)
  {
    throw new Error("Job Id required!!")
  }

  const user = await userModal.findOne({user_id:user_id})
  user.saved_info.jobs.push(jobId);
  const application = await jobApplicationModal.findOne({job_id :jobId});
  application.saved_ids.push(user_id);
  await application.save(); 
  await user.save();

  return res.json({"success":true})
})

export const unSaveJobApplication = asyncHandler(async(req,res)=>{
  const {jobId} = req.body;
  const {user_id} = req.user;

  if(!jobId)
  {
    throw new Error("Job Id required!!")
  }

  const user = await userModal.findOne({user_id:user_id})
  user.saved_info.jobs = user.saved_info.jobs?.filter((id)=>id !== jobId);
  const application = await jobApplicationModal.findOne({job_id :jobId});
  application.saved_ids= application.saved_ids.filter((id)=>id!== user_id);
  await application.save();
  await user.save();
  return res.json({"success":true})
})


