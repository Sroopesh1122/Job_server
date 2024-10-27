import asyncHandler from "express-async-handler";
import userModal from "../modals/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jobApplicationModal } from "../modals/JobApplication.js";
import { ProjectApplicationModal } from "../modals/ProjectApplication.js";
import { sendMail } from "../utils/MailSender.js";
import { providerModal } from "../modals/JobProvider.js";
import { freelancerModel } from "../modals/Freelancer.js";

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
        <p>Thank you,<br>Your Company Name</p>
      `;
    
      const textContent = `
        Hi ${user.name},
        
        You recently requested to reset your password. Copy and paste the link below into your browser to reset it. This link will expire in 10 minutes:
        
        ${resetURL}
        
        If you did not request a password reset, please ignore this email or contact support if you have questions.
    
        Thank you,
        Emploze.in
      `;
    
      const data = {
        to: email,
        from: "Emploez",  // Use a verified and recognizable email address
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

  console.log(applicationId);
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

  const findPost = await ProjectApplicationModal.findOne({project_id:postId});
  if (!findPost) {
    throw new Error("Post not found!!");
  }

  if (findPost.applied_ids.find((i) => i === user_id)) {
    throw new Error("Already applied for this post");
  }

  findPost.applied_ids.push(user_id);
  await findPost.save();
  const user = await userModal.findOne({user_id:user_id});
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

  const query = [];

  query.push({
    $match: {
      user_id: user_id,
    },
  });

  query.push({
    $project:{
      _id:1,
      name:1,
      email:1,
      saved_info:1
    }
  })

  query.push({
    $unwind:"$saved_info.jobs"
  })

    query.push({
    $lookup: {
      from: "applications",
      localField: "saved_info.jobs",
      foreignField: "job_id",
      as: "Saved_application_info",
    },
  });

  query.push({
    $unwind:"$Saved_application_info"
  })

  query.push({
    $group:{
      _id:"$_id",
      name:{$first:"$name"},
      email:{$first:"$email"},
      saved_info:{$push:"$saved_info.jobs"}
    }
  })

  query.push({
    $project:{
      _id:1,
      name:1,
      email:1,
      saved_info : {$reverseArray: "$saved_info"}
    }
  })


  query.push({
    $addFields: {
      pageData: {
        $slice: ["$saved_info", skip, parseInt(limit)],
      },
    },
  });


  query.push({
    $unwind:"$pageData"
  })



  query.push({
    $lookup: {
      from: "applications",
      localField: "pageData",
      foreignField: "job_id",
      as: "Saved_application_info",
    },
  });

  query.push({
    $unwind: {
      path: "$Saved_application_info",
    },
  });

  query.push({
    $project: {
      "Saved_application_info.applied_ids": 0,
    },
  });

  query.push({
    $lookup: {
      from: "providers",
      localField: "Saved_application_info.provider_details",
      foreignField: "company_id",
      as: "company",
    },
  });

  query.push({
    $unwind: {
      path: "$company",
    },
  });

  query.push({
    $project: {
      "company.auth_details": 0,
      "company.job_details": 0,
      "company.project_details": 0,
    },
  });


  query.push({
    $addFields: {
      "Saved_application_info.companyData": "$company",
    },
  });


  

  query.push({
    $group: {
      _id: "$_id",
      Saved_application_info:{$push:"$Saved_application_info"}
    },
  });

  query.push({
    $project:{
      "_id":0
    }
  })

  
  const pageData = await userModal.aggregate(query);


  const query2 = []

  query2.push({
    $match: {
      user_id: user_id,
    },
  });

  query2.push({
    $project:{
      _id:1,
      name:1,
      email:1,
      saved_info:1
    }
  })

  query2.push({
    $unwind:"$saved_info.jobs"
  })

    query2.push({
    $lookup: {
      from: "applications",
      localField: "saved_info.jobs",
      foreignField: "job_id",
      as: "Saved_application_info",
    },
  });

  query2.push({
    $unwind:"$Saved_application_info"
  })



  const totalData = await userModal.aggregate(query2);

   
  return res.json({ totalData : totalData?.length, pageData:pageData[0]?.Saved_application_info})
});

export const getAppliedApplication = asyncHandler(async (req, res) => {
  const { user_id } = req.user;
let { page = 1, limit = 10 } = req.query;


const skip = (parseInt(page) - 1) * parseInt(limit);


console.log(skip,limit)

const query = [];

query.push({
  $match: {
    user_id: user_id,
  },
});

query.push({
  $unwind : "$application_applied_info.jobs"
})


query.push({
  $lookup: {
    from: "applications",
    localField: "application_applied_info.jobs.jobId",
    foreignField: "job_id",
    as: "Applied_application_info_data",
  },
});


query.push({
  $unwind : "$Applied_application_info_data"
})


query.push({
  $group:{
    _id:"$_id",
    name:{$first:"$name"},
    email:{$first:"$email"},
    application_applied_info:{$push:"$application_applied_info.jobs"}
  }
})



query.push({
  $unwind : "$application_applied_info"
})




query.push({
  $sort:{"application_applied_info.appliedDate":-1}
})

query.push({
  $group:{
        _id: "$_id", // Re-group back to user with sorted jobs
    name: { $first: "$name" },
    email: { $first: "$email" },
    jobs: { $push: "$application_applied_info"}, 
  }
})

query.push({
  $addFields: {
    pageData: {
      $slice: ["$jobs", skip, parseInt(limit)], // Paginate jobs
    },
  },
});


query.push({
  $project:{
    _id:1,
    name:1,
    pageData:1
  }
})

query.push({$unwind : "$pageData"})

query.push({
  $lookup: {
    from: "applications",
    localField: "pageData.jobId",
    foreignField: "job_id",
    as: "Applied_application_info_pageData",
  },
});

query.push({$unwind : "$Applied_application_info_pageData"})

query.push({
  $addFields: {
    "pageData.jobData":"$Applied_application_info_pageData" ,
  },
});

query.push({
  $lookup: {
    from: "providers",
    localField: "Applied_application_info_pageData.provider_details",
    foreignField: "company_id",
    as: "company",
  },
});

query.push({$unwind : "$company"})

query.push({
  $project:{
    "company.auth_details":0,
    "company.job_details":0,
    "company.project_details":0
  }
})

query.push({
  $addFields: {
    "pageData.companyData":"$company" ,
  },
});

query.push({
  $group:{
        _id: "$_id", // Re-group back to user with sorted jobs
    name: { $first: "$name" },
    pageData: { $push: "$pageData"}, 
  }
})
 
  const pageData = await userModal.aggregate(query);


  //To get Total No of AppliedDatas

 const query2=[]

  
query2.push({
  $match: {
    user_id: user_id,
  },
});

query2.push({
  $unwind : "$application_applied_info.jobs"
})

query2.push({
  $lookup: {
    from: "applications",
    localField: "application_applied_info.jobs.jobId",
    foreignField: "job_id",
    as: "Applied_application_info_pageData",
  },
});

query2.push({
  $unwind : "$Applied_application_info_pageData"
})


query2.push({
  $group:{
    _id:"$_id",
    datas:{$push:"$Applied_application_info_pageData"}
  }
})


const totalData = await userModal.aggregate(query2);
  return res.json({
    totalData: totalData[0].datas?.length || 0,
    pageData: pageData[0]?.pageData
  });
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
    $project:{
      _id:1,
      name:1,
      email:1,
      follwing:1
    }
  })

  query.push({
    $unwind:"$follwing"
  })

    query.push({
    $lookup: {
      from: "providers",
      localField: "follwing",
      foreignField: "company_id",
      as: "company",
    },
  });

  query.push({
    $unwind:"$company"
  })

  query.push({
    $project: {
      "company.auth_details": 0,
    },
  });

  query.push({
    $group:{
      _id:"$_id",
      name:{$first:"$name"},
      email:{$first:"$email"},
      companies:{$push:"$company"}
    }
  })

  query.push({
    $project:{
      _id:1,
      name:1,
      email:1,
      companies : {$reverseArray: "$companies"}
    }
  })


  query.push({
    $addFields: {
      pageData: {
        $slice: ["$companies", skip, parseInt(limit)],
      },
    },
  });


  query.push({
    $unwind:"$pageData"
  })

  query.push({
    $group:{
      _id:"$_id",
      companiesData : {$push:"$pageData"}
    }
  })

  query.push({
    $unwind:"$companiesData"
  })

  query.push({
    $project:{
      _id:0
    }
  })




  
  const pageData = await userModal.aggregate(query);


  const query2 = []

  query2.push({
    $match: {
      user_id: user_id,
    },
  });

  query2.push({
    $project:{
      _id:1,
      name:1,
      email:1,
      follwing:1
    }
  })

  query2.push({
    $unwind:"$follwing"
  })

  query2.push({
    $lookup: {
      from: "providers",
      localField: "follwing",
      foreignField: "company_id",
      as: "company",
    },
  });

  query2.push({
    $unwind:"$company"
  })

  query2.push({
    $project: {
      "company.auth_details": 0,
      "company.job_details": 0,
      "company.project_details": 0,
    },
  });

  query2.push({
    $group:{
      _id:"$_id",
      name:{$first:"$name"},
      email:{$first:"$email"},
      companies:{$push:"$company"}
    }
  })
  
  const totalData = await userModal.aggregate(query2);

  return res.json({ totalData : totalData[0]?.companies?.length || 0, pageData:pageData || []})
});



