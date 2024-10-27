import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { freelancerModel } from "../modals/Freelancer.js";
import { sendMail } from "../utils/MailSender.js";

export const FreelancerSignup = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new Error("All Fields Required!!");
  }
  try {
    const findUser = await freelancerModel.findOne({ email: email });
    if (findUser) {
      throw new Error("Email Already Exists");
    }
    const data = {
      name,
      email,
      auth_details: { password },
    };
    const user = await freelancerModel.create(data);

    const resdata = {
      userId: user.freelancer_id,
      docId: user._id,
      role: user.auth_details.role,
    };

    if (user) {
      res.json({
        authToken: await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN),
      });
    } else {
      throw new Error("Account Creation Failed");
    }
  } catch (error) {
    throw new Error(error);
  }
});

export const FreelancerSignin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new Error("All Fields Required!!");
  }
  try {
    const user = await freelancerModel.findOne({ email: email });
    if (!user) {
      throw new Error("Account Not found");
    }

    if (!(await user.isPasswordMatched(password))) {
      throw new Error("Incorrect password");
    }

    const resdata = {
      userId: user.freelancer_id,
      docId: user._id,
      role: user.auth_details.role,
    };

    res.json(await jwt.sign(resdata, process.env.JWT_SECRET_TOKEN));
  } catch (error) {
    throw new Error(error);
  }
});

export const FreelancerUpdateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await freelancerModel.findByIdAndUpdate(_id, req.body, {
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

export const FreelancerForgotPasswordHandler = asyncHandler(
  async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email required!!");
    }
    try {
      const user = await freelancerModel.findOne({ email: email });
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
          from: "Emploze",  // Use a verified and recognizable email address
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
      }
       else {
        throw new Error("Password Reset Failed!");
      }
    } catch (error) {
      throw new Error(error);
    }
  }
);

export const FreelancerPasswordResetHandler = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  try {
    const user = await freelancerModel.findOne({
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
      throw new Error("Failed to reset password");
    }
  } catch (error) {
    throw new Error(error);
  }
});