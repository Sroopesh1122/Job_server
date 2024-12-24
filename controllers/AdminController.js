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
import { adminModal } from "../modals/Admin.js";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import { sendMail } from "../utils/MailSender.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const otpStore = new Map();
const OTP_EXPIRES_AT = 1 * 60 * 1000;
const MAX_TRIES = 3;
const COOLING_PERIOD = 5 * 60 * 1000;

export const sendUserOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new Error("Email is required!");
  }

  const adminCount = await adminModal.countDocuments();

  if (adminCount >= 2) {
    throw new Error("Admin account limit reached. Only 2 admins are allowed.");
  }

  const adminExists = await adminModal.findOne({ email });
  if (adminExists) {
    throw new Error("Email already registered.");
  }

  let otpData = otpStore.get(email);

  if (otpData) {
    const { tries, lastAttemptMade } = otpData;

    if (tries >= MAX_TRIES) {
      const timeSinceLastAttempt = Date.now() - lastAttemptMade;
      if (timeSinceLastAttempt < COOLING_PERIOD) {
        const timeLeft = Math.ceil((COOLING_PERIOD - timeSinceLastAttempt) / 1000);
        return res.status(400).json({
          message: `You have exceeded the maximum number of attempts. Please try again in ${
            timeLeft > 60 ? Math.ceil(timeLeft / 60) : timeLeft
          } ${timeLeft > 60 ? 'minute' : 'seconds'}${
            timeLeft > 60 && Math.ceil(timeLeft / 60) > 1 ? 's' : ''
          }.`,
        });
      } else {
        otpStore.set(email, { tries: 0, lastAttemptMade: Date.now() });
      }
    }
  }

  const otp = otpGenerator.generate(6, {
    uppercase: false,
    specialChars: false,
  });

  otpStore.set(email, {
    otp: otp,
    expiresAt: Date.now() + OTP_EXPIRES_AT,
    tries: otpData ? otpData.tries + 1 : 1,
    lastAttemptMade: Date.now(),
  });

  await sendMail({
    from: process.env.MAIL_ID,
    to: email,
    subject: "Your OTP for Signup",
    text: `Your OTP is ${otp}. It is valid for 1 minute.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 1 minute.</p>`,
  });

  const updatedOTPData = otpStore.get(email);

  const triesLeft = MAX_TRIES - updatedOTPData.tries;

  res.json({
    message: "OTP sent successfully!",
    triesLeft,
  });
});


export const verifyUserOtp = asyncHandler(async(req, res) => {
  const { email, otp } = req.body;  

  if(!email || !otp) {
    throw new Error("Email and OTP are required!");
  }

  const otpStoredPreviously = otpStore.get(email);

  if(!otpStoredPreviously) {
    throw new Error("OTP has expired");
  }

  const { otp: validOtp, expiresAt } = otpStoredPreviously;

  if(Date.now() > expiresAt) {
    otpStore.delete(email);
    throw new Error("OTP has expired");
  }

  if(validOtp === otp) {
    otpStore.delete(email);
    res.json({ message: "OTP verified successfully!" });
  } else {
    throw new Error("Invalid OTP!");
  }
});

export const adminSignUp = asyncHandler(async (req, res) => {
  const { email, password, admin_name } = req.body;

  if (!email || !password ||!admin_name) {
    throw new Error("All fields required");
  }

  try {
    const findAdmin = await adminModal.findOne({ "email": email });
    if (findAdmin) {
      throw new Error("Email already exists");
    }

    const data = {
      admin_name, email, auth_details: { password },
    };

    const admin = await adminModal.create(data);

    const resData = {
      adminId: admin.admin_id,
      docId: admin._id
    };

    if (admin) {
      res.json({ authToken: await jwt.sign(resData, process.env.JWT_SECRET_TOKEN)});
    } else {
      throw new Error("Account creation failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const adminSignIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new Error("All fields required");
  }

  try {
    const admin = await adminModal.findOne({ "email": email });
    if (!admin) {
      throw new Error("Accout not found");
    }

    if(!(await admin.isPasswordMatched(password))) {
      throw new Error("Incorrect password");
    }

    const resData = {
      adminId: admin.admin_id,
      docId: admin._id
    };

    res.json(await jwt.sign(resData, process.env.JWT_SECRET_TOKEN));
  } catch (error) {
    throw new Error(error);
  }
});

export const AdminForgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new Error("Email required!!");
  }
  try {
    const user = await adminModal.findOne({ email: email });
    if (!user) {
      throw new Error("Account Not Found");
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    if (user) {
      const resetURL = `${process.env.FRONT_END_URL}/admin/reset-password/${resetToken}`;
      const htmlContent = `
        <p>Hi ${user.admin_name},</p>
        <p>We received a request to reset your admin password. Click the link below to reset it. This link will expire in 5 minutes:</p>
        <p><a href="${resetURL}">Reset your password</a></p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
        <p>Thank you,<br>Emploez.in Team</p>
      `;
    
      const textContent = `
        Hi ${user.admin_name},
        
        We received a request to reset your admin password. Copy and paste the link below into your browser to reset it. This link will expire in 5 minutes:
        
        ${resetURL}
        
        If you did not request a password reset, please ignore this email or contact support if you have any concerns.
    
        Thank you,
        Emploez.in Team
      `;
    
      const data = {
        to: email,
        from: `${process.env.MAIL_ID}`, // Use a verified and recognizable email address
        subject: "Admin Password Reset Request",
        text: textContent,
        html: htmlContent,
      };
    
      try {
        await sendMail(data);
      } catch (error) {
        console.log(error);
      }
      res.json({ message: "Password reset email sent" });
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const AdminPasswordResetHandler = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
      throw new Error("New password is required!");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
      const user = await adminModal.findOne({
          "auth_details.passwordResetToken": hashedToken,
      });

      if (!user) {
          throw new Error("Invalid token");
      }

      if (Date.now() > user.auth_details.passwordResetExpiresAt) {
          throw new Error("Token expired! Try again later");
      }

      const isSameAsCurrentPassword = await bcrypt.compare(password, user.auth_details.password);

      if (isSameAsCurrentPassword) {
          throw new Error("Cannot reuse the current password.");
      }

      user.auth_details.password = password;
      user.auth_details.passwordResetToken = undefined;
      user.auth_details.passwordResetExpiresAt = undefined;

      await user.save();

      res.json({ message: "Password has been reset successfully!" });
  } catch (error) {
      throw new Error(error.message || "Failed to reset password");
  }
});




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
  const { page = 1, limit = 1 ,isBlocked , q ,isVerified} = req.query;


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

  if(isVerified)
  {
    if(isVerified === "false")
      {
        filter={...filter, isVerified:false}
      }else{
        filter={...filter,isVerified:true}
      }

  }

  
  if(q)
  {
    filter = {...filter , $or: [
      { company_name: { $regex: "^" + q, $options: "i" } },
      { company_id: { $regex: "^" + q, $options: "i" } },
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
      { freelancer_id: { $regex: "^" + q, $options: "i" } },
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
  const seekerData = await getActiveUserStatistics(days);
  const providerData = await getActiveProviderStatistics(days);
  const freelancerData = await getActiveFreelancerStatistics(days)
  return res.json( { seekerData ,providerData,freelancerData});
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


export const getAllVerificationPendingproviders = asyncHandler(async(req,res)=>{

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
        counts: activeUsersCount,
      });
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error);
    }
  }
  return data;
};


const getActiveProviderStatistics = async (days = 7) => {
  const data = [];

  for (let i = 0; i < days; i++) {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 23, 59, 59, 999));

    const formattedDate = `${startOfDay.getUTCDate().toString().padStart(2, "0")}/${(startOfDay.getUTCMonth() + 1).toString().padStart(2, "0")}/${startOfDay.getUTCFullYear()}`;

    try {
      const activeUsersCount = await providerModal.countDocuments({
        lastActive: { $gte: startOfDay, $lt: endOfDay },
      });

      data.push({
        Date: formattedDate,
        counts: activeUsersCount,
      });
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error);
    }
  }
  return data;
};

const getActiveFreelancerStatistics = async (days = 7) => {
  const data = [];

  for (let i = 0; i < days; i++) {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i, 23, 59, 59, 999));

    const formattedDate = `${startOfDay.getUTCDate().toString().padStart(2, "0")}/${(startOfDay.getUTCMonth() + 1).toString().padStart(2, "0")}/${startOfDay.getUTCFullYear()}`;

    try {
      const activeUsersCount = await freelancerModel.countDocuments({
        lastActive: { $gte: startOfDay, $lt: endOfDay },
      });

      data.push({
        Date: formattedDate,
        counts: activeUsersCount,
      });
    } catch (error) {
      console.error(`Error fetching data for ${formattedDate}:`, error);
    }
  }
  return data;
};





