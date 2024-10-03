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
      res.json({user , token : await jwt.sign(resdata,process.env.JWT_SECRET_TOKEN)});
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

  console.log(id)

  const findAccount = await providerModal.findOne({company_id : id});
  if(!findAccount)
  {
    throw new Error("Account Not found");
  }
  return res.json(findAccount);
})

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
