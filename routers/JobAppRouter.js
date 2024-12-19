import { Router } from "express";
import { authProviderMiddleware, checkIsBlocked, checkProviderVerify, getProfileMiddleware, waitMiddleware } from "../middlewares/AuthHandler.js";
import {
  addToShortList,
  createJobPost,
  deleteJobPost,
  getAllCategoriesAndSubCategories,
  getAllJobPost,
  getApplicationStatus,
  getJobPost,
  getPostShortList,
  getSuggestedJobs,
  removeFromShortList,
  sendEmailToAllShortlist,
  updateApplicationStatus,
} from "../controllers/JobAppController.js";
import { postData } from "../assets/dummyData.js";

export const JobAppRouter = Router();


JobAppRouter.post("/create", authProviderMiddleware,checkProviderVerify, checkIsBlocked, createJobPost);
JobAppRouter.delete("/:id", authProviderMiddleware,checkProviderVerify,checkIsBlocked, deleteJobPost);
JobAppRouter.get("/category", getAllCategoriesAndSubCategories);
JobAppRouter.get("/suggestion",getProfileMiddleware ,getSuggestedJobs);
JobAppRouter.post("/user/status",getApplicationStatus)
JobAppRouter.put("/status/change",authProviderMiddleware,updateApplicationStatus)
JobAppRouter.get("/:id", getJobPost);


//remove it later 
JobAppRouter.get("/sample/jobs", async (req, res) => {
  const { page } = req.query;

  let start = 10 * (page - 1);
  let end = start + 11;

  const pageData = postData.slice(start, end);
  setTimeout(() => {
    res.json({length : postData.length , pageData});
  }, 5000);
});

JobAppRouter.get("/", getProfileMiddleware,getAllJobPost);

//For  Appplication Shortlist


JobAppRouter.post("/post/shortlist/add",authProviderMiddleware,checkIsBlocked,addToShortList)
JobAppRouter.delete("/post.shortlist/delete",authProviderMiddleware,checkIsBlocked,removeFromShortList)
JobAppRouter.get("/post/shortlist",authProviderMiddleware,checkIsBlocked,getPostShortList)
JobAppRouter.post("/post/sendEmail",authProviderMiddleware,checkIsBlocked ,sendEmailToAllShortlist)
