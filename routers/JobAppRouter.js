import { Router } from "express";
import { authProviderMiddleware } from "../middlewares/AuthHandler.js";
import {
  createJobPost,
  deleteJobPost,
  getAllCategoriesAndSubCategories,
  getAllJobPost,
  getJobPost,
} from "../controllers/JobAppController.js";
import { postData } from "../assets/dummyData.js";

export const JobAppRouter = Router();

JobAppRouter.post("/create", authProviderMiddleware, createJobPost);
JobAppRouter.delete("/:id", authProviderMiddleware, deleteJobPost);
JobAppRouter.get("/category", getAllCategoriesAndSubCategories);
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
JobAppRouter.get("/", getAllJobPost);

