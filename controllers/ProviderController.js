import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import { providerModal } from "../modals/JobProvider.js";

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
    if (user) {
      res.json(user);
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
      token: await jwt.sign(user?.id, process.env.JWT_SECRET_TOKEN),
    };

    res.json(resdata);
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
