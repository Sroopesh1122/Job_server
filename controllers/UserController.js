import asyncHandler from "express-async-handler";
import userModal from "../modals/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { sendMail } from "../utils/MailSender.js";
import { providerModal } from "../modals/JobProvider.js";
import { sendNotification } from "../utils/NotificationSender.js";
import otpGenerator from "otp-generator";

const otpStore = new Map();
const OTP_EXPIRES_AT = 1 * 60 * 1000;
const MAX_TRIES = 3;
const COOLING_PERIOD = 5 * 60 * 1000;

export const sendUserOtp = asyncHandler(async(req, res) => {
  const { email } = req.body;

  if(!email) {
    throw new Error("Email is required!");
  }

  const userExists = await userModal.findOne({ email });
  if(userExists) {
    throw new Error("Email already registered.");
  }

  let otpData = otpStore.get(email);

  if (otpData) {
    const {tries, lastAttemptMade} = otpData;

    if (tries >= MAX_TRIES) {
      const timeSinceLastAttempt = Date.now() - lastAttemptMade;
      if(timeSinceLastAttempt < COOLING_PERIOD) {
        const timeLeft = Math.ceil((COOLING_PERIOD - timeSinceLastAttempt) / 1000);
        return res.status(400).json({
          message: `You have exceeded the maximum number of attempts. Please try again in ${
            timeLeft > 60 ? Math.ceil(timeLeft / 60) : timeLeft
          } ${timeLeft > 60 ? 'minute' : 'seconds'}${timeLeft > 60 && Math.ceil(timeLeft / 60) > 1 ? 's' : ''}.`,
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
    tries: otpData? otpData.tries + 1 : 1,
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

export const signup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    throw new Error("All Fields Required!!");
  }

  try {
    const findUser = await userModal.findOne({ email: email });
    if (findUser) {
      throw new Error("Email Already Exists");
    }
    const data = {
      name,
      email,
      auth_details: { password },
    };
    const user = await userModal.create(data);
    const resdata = {
      userId: user.user_id,
      docId: user._id,
    };
    if (user) {
      res.json({
        user,
        authToken: await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN),
      });
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
    const user = await userModal.findOne({ email: email });
    if (!user) {
      throw new Error("Account Not found");
    }

    if (!(await user.isPasswordMatched(password))) {
      throw new Error("Incorrect password");
    }

    const resdata = {
      userId: user.user_id,
      docId: user._id,
    };

    res.json(await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN));
  } catch (error) {
    throw new Error(error);
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await userModal.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    if (user) {
      const data = {
        title: "Profile updated",
        description: "User profile updated successfully",
        img: "",
        navigate_link: "/user/profile",
        receiver: req?.user?.user_id,
        sender: "",
      };
      sendNotification(data);
      res.json(user);
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const getUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const findUser = await userModal.findById(_id);
  if (!findUser) {
    throw new Error("User Not Found");
  }
  return res.json(findUser);
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let findUser = await userModal.findOne({ user_id: id });
  if (!findUser) {
    throw new Error("User Not Found");
  }
  return res.json(findUser);
});

export const forgotPasswordHandler = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new Error("Email required!!");
  }
  try {
    const user = await userModal.findOne({ email: email });
    if (!user) {
      throw new Error("Account Not Found");
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    if (user) {
      const resetURL = `${process.env.FRONT_END_URL}/reset-password/${resetToken}`;
      const htmlContent = `
        <p>Hi ${user.name},</p>
        <p>You recently requested to reset your password. Click the link below to reset it. This link will expire in 5 minutes:</p>
        <p><a href="${resetURL}">Reset your password</a></p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>Thank you,<br>Emploez.in</p>
      `;

      const textContent = `
        Hi ${user.name},
        
        You recently requested to reset your password. Copy and paste the link below into your browser to reset it. This link will expire in 10 minutes:
        
        ${resetURL}
        
        If you did not request a password reset, please ignore this email or contact support if you have questions.
    
        Thank you,
        Emploez.in
      `;

      const data = {
        to: email,
        from: `${process.env.MAIL_ID}`, // Use a verified and recognizable email address
        subject: "Password Reset Request",
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

export const passwordResetHandler = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const user = await userModal.findOne({
      "auth_details.passwordResetToken": hashedToken,
    });
    if (!user) {
      throw new Error("Invalid token");
    }

    if (Date.now() > user.auth_details.passwordResetExpiresAt) {
      throw new Error("Token expired! ,Try Again later");
    }
    user.auth_details.password = password;
    user.auth_details.passwordResetToken = undefined;
    user.auth_details.passwordResetExpiresAt = undefined;
    await user.save();
    if (user) {
      const data = {
        title: "Password Reset",
        description: "Account password Reset Successfully",
        img: "https://icons.veryicon.com/png/o/miscellaneous/remitting-country-linear-icon/password-148.png",
        navigate_link: "",
        receiver: req?.user?.user_id,
        sender: "",
      };
      sendNotification(data);
      res.json({ user });
    } else {
      throw new Error("Profile Update Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

// add job and project frunctionality

export const addJobPost = asyncHandler(async (req, res) => {
  const { _id, user_id } = req.user;
  const { applicationId } = req.body;

  if (!applicationId) {
    throw new Error("Application is Required!!");
  }
  const findPost = await jobApplicationModal.findOne({ job_id: applicationId });
  if (!findPost) {
    throw new Error("Application Post not found!!");
  }
  //adding applied user details to application
  if (
    await jobApplicationModal.findOne({
      "applied_ids.userId": user_id,
      job_id: applicationId,
    })
  ) {
    throw new Error("Already applied for this post");
  }

  findPost.applied_ids.push({ userId: user_id, status: "Applied" });
  await findPost.save();
  const user = await userModal.findById(_id);
  user.application_applied_info.jobs.push({ jobId: applicationId });
  await user.save();
  res.json({
    success: true,
    applied_list: [...user.application_applied_info.jobs],
  });
});

export const addprojectPost = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  const { postId } = req.body;
  if (!postId) {
    throw new Error("All fields Required");
  }

  const findPost = await ProjectApplicationModal.findOne({
    project_id: postId,
  });
  if (!findPost) {
    throw new Error("Post not found!!");
  }

  if (findPost.applied_ids.find((i) => i === user_id)) {
    throw new Error("Already applied for this post");
  }

  findPost.applied_ids.push(user_id);
  await findPost.save();
  const user = await userModal.findOne({ user_id: user_id });
  user.application_applied_info.projects.push({
    projectId: postId,
  });
  await user.save();
  res.json({ success: true });
});

export const followCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.body;
  const { user_id } = req.user;

  if (!companyId) {
    throw new Error("Company Id required!!");
  }

  const company = await providerModal.findOne({ company_id: companyId });
  if (!company) {
    throw new Error("Company Not Found!");
  }

  if (company.followers.find((id) => id === user_id)) {
    throw new Error("Already following");
  }

  company.followers.push(user_id);
  const user = await userModal.findOne({ user_id: user_id });
  user.follwing.push(company.company_id);
  await user.save();
  await company.save();
  const data = {
    title: "Following",
    description: `Started following ${company?.company_name}`,
    img: company?.img?.url || "",
    navigate_link: `/user/company/${company?.company_id}`,
    receiver: req?.user?.user_id,
    sender: "",
  };
  sendNotification(data);
  return res.json({ success: true });
});

export const unfollowCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.body;
  const { user_id } = req.user;

  if (!companyId) {
    throw new Error("Company Id required!!");
  }

  const company = await providerModal.findOne({ company_id: companyId });
  if (!company) {
    throw new Error("Company Not Found!");
  }

  if (!company.followers.find((id) => id === user_id)) {
    throw new Error("user id not found");
  }

  company.followers = company.followers.filter((id) => id !== user_id);
  const user = await userModal.findOne({ user_id: user_id });
  user.follwing = user.follwing.filter((id) => id !== companyId);
  await user.save();
  await company.save();
  return res.json({ success: true });
});

export const saveJobApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const { user_id } = req.user;

  if (!jobId) {
    throw new Error("Job Id required!!");
  }

  const user = await userModal.findOne({ user_id: user_id });
  user.saved_info.jobs.push(jobId);
  const application = await jobApplicationModal.findOne({ job_id: jobId });
  application.saved_ids.push(user_id);
  await application.save();
  await user.save();

  return res.json({ success: true });
});

export const unSaveJobApplication = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const { user_id } = req.user;

  if (!jobId) {
    throw new Error("Job Id required!!");
  }

  const user = await userModal.findOne({ user_id: user_id });
  user.saved_info.jobs = user.saved_info.jobs?.filter((id) => id !== jobId);
  const application = await jobApplicationModal.findOne({ job_id: jobId });
  application.saved_ids = application.saved_ids.filter((id) => id !== user_id);
  await application.save();
  await user.save();
  return res.json({ success: true });
});

export const getSavedApplication = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // const query = [];

  // query.push({
  //   $match: {
  //     user_id: user_id,
  //   },
  // });

  // query.push({
  //   $project: {
  //     _id: 1,
  //     name: 1,
  //     email: 1,
  //     saved_info: 1,
  //   },
  // });

  // query.push({
  //   $unwind: "$saved_info.jobs",
  // });

  // query.push({
  //   $lookup: {
  //     from: "applications",
  //     localField: "saved_info.jobs",
  //     foreignField: "job_id",
  //     as: "Saved_application_info",
  //   },
  // });

  // query.push({
  //   $unwind: "$Saved_application_info",
  // });

  // query.push({
  //   $group: {
  //     _id: "$_id",
  //     name: { $first: "$name" },
  //     email: { $first: "$email" },
  //     saved_info: { $push: "$Saved_application_info" },
  //   },
  // });


  // query.push({
  //   $addFields: {
  //     pageData: {
  //       $slice: ["$saved_info", skip, parseInt(limit)],
  //     },
  //   },
  // });

  // query.push({
  //   $project: {
  //     saved_info: 0,
  //   },
  // });

  // query.push({
  //   $unwind: "$pageData",
  // });

  // query.push({
  //   $project: {
  //     "pageData.saved_ids": 0,
  //     "pageData.applied_ids": 0,
  //   },
  // });

  // query.push({
  //   $lookup: {
  //     from: "providers",
  //     localField: "pageData.provider_details",
  //     foreignField: "company_id",
  //     as: "company",
  //   },
  // });

  // query.push({
  //   $unwind: {
  //     path: "$company",
  //     preserveNullAndEmptyArrays: true,
  //   },
  // });

  // query.push({
  //   $project: {
  //     "company.auth_details": 0,
  //     "company.job_details": 0,
  //     "company.project_details": 0,
  //   },
  // });

  // const pageData = await userModal.aggregate(query);

  // //Extarcting only application and company Data
  // const resultData = pageData.map((data) => {
  //   return {
  //     saved_app_info: data.pageData,
  //     companyData: data.company || {},
  //   };
  // });

  // const query2 = [];

  // query2.push({
  //   $match: {
  //     user_id: user_id,
  //   },
  // });

  // query2.push({
  //   $project: {
  //     _id: 1,
  //     name: 1,
  //     email: 1,
  //     saved_info: 1,
  //   },
  // });

  // query2.push({
  //   $unwind: "$saved_info.jobs",
  // });

  // query2.push({
  //   $lookup: {
  //     from: "applications",
  //     localField: "saved_info.jobs",
  //     foreignField: "job_id",
  //     as: "Saved_application_info",
  //   },
  // });

  // query2.push({
  //   $unwind: "$Saved_application_info",
  // });
  // const totalData = await userModal.aggregate(query2);
  // return res.json({ totalData: totalData?.length, pageData: resultData });



  // Remove Deleted Post
  const filterData = await userModal.aggregate([
    {
      $match: { user_id: user_id },
    },
    {
      $unwind: {
        path: "$saved_info.jobs",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "applications",
        localField: "saved_info.jobs",
        foreignField: "job_id",
        as: "jobDetails",
      },
    },

    {
      $match: {
        jobDetails: { $ne: [] },
      },
    },

    {
      $group: {
        _id: "$_id",
        filteredJobs: { $push: "$saved_info.jobs" },
      },
    },
  ]);

  const userData = await userModal.findOneAndUpdate(
    { user_id: user_id },
    { "saved_info.jobs": filterData[0].filteredJobs },{new:true}
  );

  const totalData = userData.saved_info.jobs.length

   const pageDataIds =  userData.saved_info.jobs.slice(skip,parseInt(page)*parseInt(limit))

   const savedApplicationData = []

   for(const jobIds of pageDataIds)
   {
      const jobData = await jobApplicationModal.findOne({job_id:jobIds})
      if(jobData)
      {
        const companyData = await providerModal.findOne({company_id:jobData.provider_details})
        if(companyData)
        {
          savedApplicationData.push({saved_app_info:jobData , companyData:companyData})
        }else{
          savedApplicationData.push({saved_app_info:jobData , companyData:{}})
        }
      }
   }
return res.json({ totalData: totalData, pageData: savedApplicationData });


});

export const getAppliedApplication = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  let { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  //Removing deleted Post
  const filterData = await userModal.aggregate([
    {
      $match: { user_id: user_id },
    },
    {
      $unwind: {
        path: "$application_applied_info.jobs",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "applications",
        localField: "application_applied_info.jobs.jobId",
        foreignField: "job_id",
        as: "jobDetails",
      },
    },

    {
      $match: {
        jobDetails: { $ne: [] },
      },
    },

    {
      $group: {
        _id: "$_id",
        filteredJobs: { $push: "$application_applied_info.jobs" },
      },
    },
  ]);

  const userData = await userModal.findOneAndUpdate(
    { user_id: user_id },
    { "application_applied_info.jobs": filterData[0].filteredJobs },{new:true}
  );

  const totalData = userData.application_applied_info.jobs?.length;

   const pageData =  userData.application_applied_info.jobs.slice(skip,parseInt(page)*parseInt(limit))

   const appliedData = []

   for(const data of pageData)
   {
      const jobData = await jobApplicationModal.findOne({job_id:data.jobId})
      if(jobData)
      {
        const companyData = await providerModal.findOne({company_id:jobData.provider_details})
        if(companyData)
        {
          appliedData.push({jobData:jobData , companyData:companyData})
        }else{
          appliedData.push({jobData:jobData , companyData:{}})
        }
      }
   }
   res.json({totalData:totalData ,pageData:appliedData})
});

export const getFollowingCompanies = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = [];

  query.push({
    $match: {
      user_id: user_id,
    },
  });

  query.push({
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      follwing: 1,
    },
  });

  query.push({
    $unwind: "$follwing",
  });

  query.push({
    $lookup: {
      from: "providers",
      localField: "follwing",
      foreignField: "company_id",
      as: "company",
    },
  });

  query.push({
    $unwind: "$company",
  });

  query.push({
    $project: {
      "company.auth_details": 0,
    },
  });

  query.push({
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      email: { $first: "$email" },
      companies: { $push: "$company" },
    },
  });

  query.push({
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      companies: { $reverseArray: "$companies" },
    },
  });

  query.push({
    $addFields: {
      pageData: {
        $slice: ["$companies", skip, parseInt(limit)],
      },
    },
  });

  query.push({
    $unwind: "$pageData",
  });

  query.push({
    $group: {
      _id: "$_id",
      companiesData: { $push: "$pageData" },
    },
  });

  query.push({
    $unwind: "$companiesData",
  });

  query.push({
    $project: {
      _id: 0,
    },
  });

  const pageData = await userModal.aggregate(query);

  const query2 = [];

  query2.push({
    $match: {
      user_id: user_id,
    },
  });

  query2.push({
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      follwing: 1,
    },
  });

  query2.push({
    $unwind: "$follwing",
  });

  query2.push({
    $lookup: {
      from: "providers",
      localField: "follwing",
      foreignField: "company_id",
      as: "company",
    },
  });

  query2.push({
    $unwind: "$company",
  });

  query2.push({
    $project: {
      "company.auth_details": 0,
      "company.job_details": 0,
      "company.project_details": 0,
    },
  });

  query2.push({
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      email: { $first: "$email" },
      companies: { $push: "$company" },
    },
  });

  const totalData = await userModal.aggregate(query2);

  return res.json({
    totalData: totalData[0]?.companies?.length || 0,
    pageData: pageData || [],
  });
});
