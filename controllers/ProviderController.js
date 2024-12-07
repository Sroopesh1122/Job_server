import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from 'crypto'
import { providerModal } from "../modals/JobProvider.js";
import { jobApplicationModal } from "../modals/JobApplication.js";
import otpGenerator from "otp-generator";
import { sendMail } from "../utils/MailSender.js";

const otpStore = new Map();

export const sendProviderOTP = asyncHandler(async(req, res) => {
  const { email } = req.body;

  if(!email) {
    throw new Error("Email is required!");
  }

  const userExists = await providerModal.findOne({ email });
  if(userExists) {
    throw new Error("Email already registered.");
  }

  const otp = otpGenerator.generate(6, {
    uppercase: false,
    specialChars: false,
  });

  otpStore.set(email, otp);

  await sendMail({
    from: process.env.MAIL_ID,
    to: email,
    subject: "Your OTP for Signup",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
  });

  res.json({ message: "OTP sent successfully!" });
});

export const verifyProviderOTP = asyncHandler(async(req, res) => {
  const { email, otp } = req.body;  

  if(!email || !otp) {
    throw new Error("Email and OTP are required!");
  }
  const validOtp = otpStore.get(email);
  if(validOtp && validOtp === otp) {
    otpStore.delete(email);
    res.json({ message: "OTP verified successfully!" });
  } else {
    throw new Error("Invalid or Expired OTP!");
  }
});

export const providerSignup = asyncHandler(async (req, res) => {
  const { email, password, company_name } = req.body;
  console.log(req.body);
  

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

    const resdata = {
      userId: user.company_id,
      docId: user._id
    };

    if (user) {
      res.json({ authToken : await jwt.sign(resdata,process.env.JWT_SECRET_TOKEN)});
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
      userId: user.company_id,
      docId: user._id
    };

    res.json(await jwt.sign(resdata,process.env.JWT_SECRET_TOKEN));
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
      const resetURL = `${process.env.FRONT_END_URL}/provider/reset-password/${resetToken}`;
      const htmlContent = `
        <p>Hi ${user.company_name},</p>
        <p>You recently requested to reset your password. Click the link below to reset it. This link will expire in 5 minutes:</p>
        <p><a href="${resetURL}">Reset your password</a></p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>Thank you,<br>Emploez.in</p>
      `;
    
      const textContent = `
        Hi ${user.company_name},
        
        You recently requested to reset your password. Copy and paste the link below into your browser to reset it. This link will expire in 10 minutes:
        
        ${resetURL}
        
        If you did not request a password reset, please ignore this email or contact support if you have questions.
    
        Thank you,
        Emploez.in
      `;
    
      const data = {
        to: email,
        from: `${process.env.MAIL_ID}`,  // Use a verified and recognizable email address
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

export const getProviderProfileById= asyncHandler(async(req,res)=>{
  const {id} = req.params;

  const query =[];

  const matchStage = {};

  matchStage.company_id = id;


  query.push({$match : matchStage})

  query.push({
    $lookup: {
      from: "applications",
      localField: "job_details.jobs.jobId",
      foreignField: "job_id", // Adjust based on your actual field name in the providers collection
      as: "Applications_info",
    },
  });

  const findAccount = await providerModal.aggregate(query)
  if(!findAccount)
  {
    throw new Error("Account Not found");
  }
    return res.json({accountData : findAccount[0]});
})

export const getAllProviders = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, q } = req.query;

  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.company_name = { $regex: `.*${q.trim()}.*`, $options: "i" };
  }

  // Match stage
  query.push({ $match: matchStage });

  // Sort stage - placed before pagination stages
  query.push({ $sort: { createdAt: -1 } });

  // Project stage: Exclude auth_details
  query.push({
    $project: {
      auth_details: 0,
    },
  });

  // Duplicate query array for total count
  const totalResultsQuery = [...query];

  // Add $count for total results count
  totalResultsQuery.push({
    $count: "totalResults",
  });

  // Get total number of results
  const totalResultsData = await providerModal.aggregate(totalResultsQuery);
  const totalResults = totalResultsData.length > 0 ? totalResultsData[0].totalResults : 0;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  query.push({ $skip: parseInt(skip) });
  query.push({ $limit: parseInt(limit) });

  // Fetch paginated results
  const results = await providerModal.aggregate(query);
  res.json({ totalDatas: totalResults, pageData: results });
});


export const getCompanyTitles = asyncHandler(async (req, res) => {
  const { q } = req.params;


  console.log(q)

  const query = [];
  const matchStage = {};

  if (q && q !== "") {
    matchStage.company_name = { $regex: `.*${q.trim()}.*`, $options: "i" };
  }

  query.push({ $match: matchStage });

  query.push({
    $project: {
      company_name: 1,
    },
  });

  // Duplicate query array for total count
  const totalResultsQuery = [...query];

  // Get total number of results
  const totalResultsData = await providerModal.aggregate(totalResultsQuery);
  res.json(totalResultsData)
});

export const changeJobApplicationStatus = asyncHandler(async(req,res)=>{

  const {_id ,company_id} = req.user;

  const { applicationId ,status ,user} = req.body;

  if(!applicationId || !status || !user)
  {
    throw new Error("ApplicationId Or status Or userId is Required!!");
  }

  const findPost = await jobApplicationModal.findOne({job_id : applicationId});
  if(!findPost)
  {
    throw new Error("Application Post not found!!")
  }

  if(findPost.provider_details !== company_id)
  {
    throw new Error("Only Auth user can access")
  }

  if(await jobApplicationModal.findOne({job_id : applicationId , "applied_ids.userId":user}))
  {
    if(await jobApplicationModal.findOneAndUpdate({job_id : applicationId , "applied_ids.userId":user},{$set: { "applied_ids.$.status": status }},{new:true}))
    {
      res.json({success:true})
    }
   
  }
  else{
    throw new Error("Applicant not found")
  }
})
