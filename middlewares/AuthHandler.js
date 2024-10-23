import asyncHandler from "express-async-handler";
import userModal from "../modals/User.js";
import jwt, { decode } from "jsonwebtoken";
import { providerModal } from "../modals/JobProvider.js";

export const authUserMiddleware = asyncHandler(async (req, res, next) => {
  let token = null;
  if (req?.headers?.authorization) {
    token = req?.headers?.authorization.split(" ")[1];
    let decoded;
    try {
      decoded = await jwt.verify(token, process.env.JWT_SECRET_TOKEN)
    } catch (error) {
      throw new Error("Not Authorized token expired ");
    }
    const user = await userModal.findOne({user_id : decoded.userId});
    if (!user) {
      throw new Error("Account Not Found");
    }
    req.user = user;
    next();
  } else {
    throw new Error("There is no token attached to header");
  }
});

export const authProviderMiddleware = asyncHandler(async (req, res, next) => {
  let token = null;
  if (req?.headers?.authorization) {
    token = req?.headers?.authorization.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    } catch (error) {
      throw new Error("Not Authorized token expired ");
    }
    const user = await providerModal.findOne({company_id : decoded.userId});
    if (!user) {
      throw new Error("Account Not Found");
    }
    req.user = user;
    next();
  } else {
    throw new Error("There is no token attached to header");
  }
});


export const getProfileMiddleware = asyncHandler(async (req, res, next) => {
  let token = null;
  if (req?.headers?.authorization) {
    token = req?.headers?.authorization.split(" ")[1];
    let decoded;
    decoded = await jwt.verify(token, process.env.JWT_SECRET_TOKEN)
    const user = await userModal.findOne({user_id : decoded.userId});
    req.user = user;
  }
  next();
});


export const isAdmin = asyncHandler(async (req, res, next) => {
  if (req?.user?.auth_details?.role === "admin") {
    next();
  } else {
    throw new Error("Access Denied for users");
  }
});


export const waitMiddleware = asyncHandler(async (req,res,next)=>{
  setTimeout(()=>{
    next()
  },2000)
})

