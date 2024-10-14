import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getRandomIds } from "../utils/generateRandomIds.js";
import { type } from "os";

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      unique: true,
    },
    name: {
      required: true,
      type: String,
      trim: true,
    },
    email: {
      required: true,
      type: String,
      unique: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    auth_details: {
      role: {
        type: String,
        enum: ["seeker", "employer", "admin"],
        default: "seeker",
      },
      password: {
        type: String,
        required: true,
      },
      passwordResetToken: {
        type: String,
        default: null,
      },
      passwordResetExpiresAt: {
        type: Date,
        default: null,
      },
    },
    profile_details: {
      // qualification: {
      //   type: String,
      //   default: null,
      // },
      summary: {
        type: String,
        default: null,
      },
      profileImg: {
        type: String,
        default:
          "https://www.pngitem.com/pimgs/m/150-1503945_transparent-user-png-default-user-image-png-png.png",
      },
      gender: {
        type: String,
        enum: ["Male", "Female", "Transgender","male","MALE","female","FEMALE","transgender"],
      },
      skills: [
        {
          type: String,
        },
      ],
    },
    education_details: {
      qualification: {
        type: String,
        default: null,
      },
      specification: {
        type: String,
        default: null,
      },
      institute_name: {
        type: String,
        default: null,
      },
      percentage: {
        type: String,
        default: null,
      },
      yearOfPassout: {
        type: String,
        default: null,
      },
    },
    internship_details: [
      {
        company_name: {
          type: String,
          default: null,
        },
        project: {
          type: String,
          default: null,
        },
        project_description: {
          type: String,
          default: null,
        },
        start_month: {
          type: String,
          default: null,
        },
        end_month: {
          type: String,
          default: null,
        },
      },
    ],
    saved_info:{
      jobs:[{type:String}]
    },
    application_applied_info: {
      jobs: [
        {
          jobId: { type: String },
          appliedDate: { type: Date, default: Date.now() },
        },
      ],
      projects: [
        {
          projectId: { type: String },
          appliedDate: { type: Date, default: Date.now() },
        },
      ],
    },
    follwing:[{type:String}]
  },
  { timestamps: true }
);

// Middleware to generate a unique user_id
userSchema.pre("save", async function (next) {
  // Check if the password field has been modified for password encryption
  if (!this.isModified("auth_details.password")) {
    next();
  }

  // Generate and hash password if modified
  const salt = bcrypt.genSaltSync(10);
  this.auth_details.password = await bcrypt.hash(
    this.auth_details.password,
    salt
  );

  // Generate unique user_id if it doesn't exist
  if (!this.user_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5; // Set a retry limit

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'USER-' }); // Generate user_id
      const existingUser = await mongoose.model("users").findOne({ user_id: randomString });

      if (!existingUser) {
        this.user_id = randomString; // Assign unique user_id
        isUnique = true;
      } else {
        retries += 1; // Retry if collision occurs
      }
    }

    if (!isUnique) {
      return next(new Error("Failed to generate a unique user ID after several attempts."));
    }
  }

  next();
});

userSchema.methods.isPasswordMatched = async function (inputPassword) {
  return bcrypt.compareSync(inputPassword, this.auth_details.password);
};

userSchema.methods.generatePasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenEncry = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.auth_details.passwordResetToken = passwordResetTokenEncry;
  this.auth_details.passwordResetExpiresAt = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

export default mongoose.model("users", userSchema);
