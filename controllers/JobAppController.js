import asyncHandler from "express-async-handler";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { isValidObjectId } from "mongoose";
import { providerModal } from "../modals/JobProvider.js";


export const createJobPost = asyncHandler(async (req, res) => {
  const { name, description, salary, qualification } = req.body;
  const { _id } = req.user;
  if (!name || !description || !salary || !qualification) {
    throw new Error("All Fields Required!");
  }

  const jobPost = await jobApplicationModal.create({
    name,
    description,
    salary,
    qualification,
    provider_details: _id,
  });
  if (!jobPost) {
    throw new Error("Job creation Failed");
  }
  const provider = await providerModal.findById(_id);
  provider.job_details.jobs.push(jobPost?._id);
  await provider.save();
  res.json(jobPost);
});

export const getJobPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new Error("Invalid Id");
  }
  const findPost = await jobApplicationModal.findById(id);
  if (!findPost) {
    throw new Error("Post not found");
  }

  res.json(findPost);
});

export const getAllJobPost = asyncHandler(async (req, res) => {
  const query = {};
  const { qualification } = req.query;
  if (qualification) {
    query["qualification"] = qualification;
  }
  const jobPosts = await jobApplicationModal.find(query);
  res.json(jobPosts);
});


export const deleteJobPost = asyncHandler(async (req, res) => {
    const {_id} = req.user;
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new Error("Invalid Id");
  }
  const findPost = await jobApplicationModal.findById(id);
  if (!findPost) {
    throw new Error("Post not Found");
  }
  await findPost.deleteOne();
  const provider = await providerModal.findById(_id);
  provider.job_details.jobs = provider.job_details.jobs.filter((id)=>id.toString() !== findPost?._id.toString());
  for(const s of provider.job_details.jobs)
  {
    console.log(s.toString())
  }
  await provider.save();
  res.json({ success: true });
});
