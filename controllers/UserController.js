import asyncHandler from "express-async-handler";
import userModal from "../modals/User.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import { jobApplicationModal } from "../modals/JobApplication.js";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { isValidObjectId } from "mongoose";

export const signup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  let { role } = req.body;

  if (!email || !password || !name) {
    throw new Error("All Fields Required!!");
  }
  // if (!role) {
  //   role = "provider";
  // }
  try {
    const findUser = await userModal.findOne({ "personal_info.email": email });
    if (findUser) {
      throw new Error("Email Already Exists");
    }
    const data = {
       name, email ,
      auth_details: { password },
    };
    const user = await userModal.create(data);
    if (user) {
      res.json(user);
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
      token: await jwt.sign(user?.id, process.env.JWT_SECRET_TOKEN),
    };

    res.json(resdata);
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
  const findUser = await userModal.findById(id);
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
    const user = await userModal.findOne({"auth_details.passwordResetToken":hashedToken});
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

export const addJobPost = asyncHandler(async(req,res)=>{
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
  const findPost = await jobApplicationModal.findById(postId);
  if(!findPost)
  {
    throw new Error("Post not found!!")
  }

  const user = await userModal.findById(_id);
  user.application_applied_info.jobs.push(postId);
  await user.save();
  res.json({success:true});
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

  const user = await userModal.findById(_id);
  user.application_applied_info.projects.push(postId);
  await user.save();
  res.json({success:true});
})



