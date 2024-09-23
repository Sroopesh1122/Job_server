import asyncHandler from "express-async-handler";
import userModal from '../modals/User.js';
import jwt from 'jsonwebtoken';


export const authMiddleware = asyncHandler(async(req,res,next)=>{
    let token=null;
  if(req?.headers?.authorization)
  {
     token=req?.headers?.authorization.split(" ")[1]
     try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
          const user = await userModal.findById(decoded);
          req.user = user;
          next();
        } catch (error) {
          throw new Error("Not Authorized token expired ");
        }
  }
  else{
    throw new Error("There is no token attached to header");
  }
})


export const isAdmin =asyncHandler(async(req,res,next)=>{
  if(req?.user?.auth_details?.role === "admin")
  {
     next();
  }
  else{
    throw new Error("Access Denied for users");
  }
})