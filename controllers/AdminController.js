import asyncHandler from "express-async-handler";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { providerModal } from "../modals/JobProvider.js";
import UserModal from "../modals/User.js";
import { ReportModal } from "../modals/Reports.js";
import { freelancerModel } from "../modals/Freelancer.js";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { getAllUsers } from "./UserController.js";
import { getAllProvidersAccount } from "./ProviderController.js";
import { getAllFreelancerAccount } from "./FreelancerController.js";

//To block User (seeker,provider,freelancer)
export const blockUser = asyncHandler(async (req, res) => {
  const { accountId, accountType } = req.body;
  if (!accountId || !accountType) {
    throw new Error("All fileds required!");
  }

  if (accountType === "user") {
    const user = await UserModal.findOne({ user_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = true;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  }
  if (accountType === "provider") {
    const user = await providerModal.findOne({ company_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = true;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  }
  if (accountType === "freelancer") {
    const user = await freelancerModel.findOne({ freelancer_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = true;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  }
});

//To Unblock User (seeker,provider,freelancer)
export const unBlockkUser = asyncHandler(async (req, res) => {
  const { accountId, accountType } = req.body;
  if (!accountId || !accountType) {
    throw new Error("All fileds required!");
  }

  if (accountType === "user") {
    const user = await UserModal.findOne({ user_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = false;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else if (accountType === "provider") {
    const user = await providerModal.findOne({ company_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = false;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else if (accountType === "freelancer") {
    const user = await freelancerModel.findOne({ freelancer_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    user.isBlocked = false;
    await user.save();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else {
    throw new Error("Something Went Wrong");
  }
});

//To delete User Account (seeker,provider,freelancer)
export const deleteUser = asyncHandler(async (req, res) => {
  const { accountId, accountType } = req.body;
  if (!accountId || !accountType) {
    throw new Error("All fileds required!");
  }

  if (accountType === "user") {
    const user = await UserModal.findOne({ user_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    await user.deleteOne();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else if (accountType === "provider") {
    const user = await providerModal.findOne({ company_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    await user.deleteOne();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else if (accountType === "freelancer") {
    const user = await freelancerModel.findOne({ freelancer_id: accountId });
    if (!user) {
      throw new Error("Account not found");
    }
    await user.deleteOne();
    return res.json({ success: true, message: "User Blocked Successfully" });
  } else {
    throw new Error("Something Went Wrong");
  }
});

//To get count of all accounts and applications (incling no's of blocked accounts)
export const getAllAccountAndApplicationsCount = asyncHandler(
  async (req, res) => {
    const totalSeekers = await UserModal.countDocuments();
    const totalBlockedSeekers = await UserModal.countDocuments({
      isBlocked: true,
    });
    const totalProviders = await providerModal.countDocuments();
    const totalBlockedProviders = await providerModal.countDocuments({
      isBlocked: true,
    });
    const totalFreelancers = await freelancerModel.countDocuments();
    const totalBlockedFreelancers = await freelancerModel.countDocuments({
      isBlocked: true,
    });
    const totalJobPost = await jobApplicationModal.countDocuments();
    const totalProjectPost = await ProjectApplicationModal.countDocuments();

    return res.json({
      totalSeekers,
      totalProviders,
      totalFreelancers,
      totalJobPost,
      totalProjectPost,
      totalBlockedFreelancers,
      totalBlockedProviders,
      totalBlockedSeekers,
    });
  }
);

//Get all user and it totalCount with filter based on fields
export const getAllSeekers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 ,isBlocked , q} = req.query;

  let filter={}
  if(isBlocked)
  {
    if(isBlocked === "false")
    {
      filter={...filter, isBlocked:false}
    }else{
      filter={...filter,isBlocked:true}
    } 
  }


  if(q)
  {
    filter = {...filter , $or: [
      { name: { $regex: "^" + q, $options: "i" } },
      { user_id: { $regex: "^" + q, $options: "i" } },
      { email: { $regex: "^" + q, $options: "i" } }
    ]}
  }
  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);
  const allSeekers = await getAllUsers(parsePage, parseLimit, filter); //Change filter
  return res.json(allSeekers);
});

export const getAllProviders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1 ,isBlocked , q} = req.query;

  let filter={}
  if(isBlocked)
  {
    if(isBlocked === "false")
    {
      filter={...filter, isBlocked:false}
    }else{
      filter={...filter,isBlocked:true}
    } 
  }

  
  if(q)
  {
    filter = {...filter , $or: [
      { name: { $regex: "^" + q, $options: "i" } },
      { user_id: { $regex: "^" + q, $options: "i" } },
      { email: { $regex: "^" + q, $options: "i" } }
    ]}
  }
  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);
  const allProviders = await getAllProvidersAccount(
    parsePage,
    parseLimit,
    filter
  ); //Change filter
  return res.json(allProviders);
});

export const getAllFreelancers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1 ,isBlocked , q} = req.query;

  let filter={}
  if(isBlocked)
  {
    if(isBlocked === "false")
    {
      filter={...filter, isBlocked:false}
    }else{
      filter={...filter,isBlocked:true}
    } 
  }

  
  if(q)
  {
    filter = {...filter , $or: [
      { name: { $regex: "^" + q, $options: "i" } },
      { user_id: { $regex: "^" + q, $options: "i" } },
      { email: { $regex: "^" + q, $options: "i" } }
    ]}
  }
  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);
  const allFreelancers = await getAllFreelancerAccount(
    parsePage,
    parseLimit,
    filter
  ); //Change filter
  return res.json(allFreelancers);
});

export const getRegistrationCount = asyncHandler(async (req, res) => {
  let { days } = req.query;
  if (days) {
    days = parseInt(days);
  }
  const resData = await getRegisteredStatistics(days);
  return res.json(resData);
});

export const getActiveUserCount = asyncHandler(async (req, res) => {
  let { days } = req.query;
  if (days) {
    days = parseInt(days);
  }
  const resData = await getActiveUserStatistics(days);
  return res.json(resData);
});


export const getAllUsersCount = asyncHandler(async(req,res)=>{
 let data={}
  try {
    const [
      UsersCount,
      ProviderCount,
      FreelancerCount,
      PostCount,
      ProjectCount
    ] = await Promise.all([
      UserModal.countDocuments(),
      providerModal.countDocuments(),
      freelancerModel.countDocuments(),
      jobApplicationModal.countDocuments(),
      ProjectApplicationModal.countDocuments()
    ]);

    data = {
      
        UsersCount,
        ProviderCount,
        FreelancerCount,
        PostCount,
        ProjectCount
    };
    
  } catch (error) {
    console.error(`Error fetching data for ${formattedDate}:`, error);
  }
  return res.json(data)
})



//Verify Provider


export const verifyProvider = asyncHandler(async (req,res)=>{

  const { accountId } = req.body;

  if(!accountId)
  {
    throw new Error("Account Id Required");
  }

  const findAccount = await providerModal.findOne({company_id:accountId});
  if(!findAccount)
  {
    throw new Error("Account not found");
  }

  findAccount.isVerified = true;
  await findAccount.save();

  res.json({success:true,message:"Account verified Successfully"})


})

const getRegisteredStatistics = async (days = 7) => {
  const data = [];

  for (let i = 0; i < days; i++) {
    const today = new Date();
    
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 23, 59, 59, 999));

    const formattedDate = `${startOfDay.getUTCDate().toString().padStart(2, "0")}/${(startOfDay.getUTCMonth() + 1).toString().padStart(2, "0")}/${startOfDay.getUTCFullYear()}`;

    try {
      const [
        registeredUsersCount,
        registeredProviderCount,
        registeredFreelancerCount,
        registeredPostCount,
        registeredProjectCount
      ] = await Promise.all([
        UserModal.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        providerModal.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        freelancerModel.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        jobApplicationModal.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
        ProjectApplicationModal.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } })
      ]);

      data.push({
        Date: formattedDate,
        counts: {
          registeredUsersCount,
          registeredProviderCount,
          registeredFreelancerCount,
          registeredPostCount,
          registeredProjectCount
        },
      });
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error);
    }
  }

  return data;
};



const getActiveUserStatistics = async (days = 7) => {
  const data = [];

  for (let i = 0; i < days; i++) {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 23, 59, 59, 999));

    const formattedDate = `${startOfDay.getUTCDate().toString().padStart(2, "0")}/${(startOfDay.getUTCMonth() + 1).toString().padStart(2, "0")}/${startOfDay.getUTCFullYear()}`;

    try {
      const activeUsersCount = await UserModal.countDocuments({
        lastActive: { $gte: startOfDay, $lt: endOfDay },
      });

      data.push({
        Date: formattedDate,
        count: activeUsersCount,
      });
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error);
    }
  }
  return data;
};
