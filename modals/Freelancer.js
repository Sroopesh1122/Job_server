import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getRandomIds } from "../utils/generateRandomIds.js";

const freelancerSchema = new mongoose.Schema(
  {
    freelancer_id: {
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
    img: {
      type: String,
      default: "https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png",
    },
    mobile: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\+?[0-9]{10,15}$/.test(v); // Adjusted for more flexibility
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    auth_details: {
      role: {
        type: String,
        enum: ["freelancer"],
        default: "freelancer",
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
    project_details: {
      projects: [
        {
          projectId: { type: String },
        },
      ],
    },
    isBlocked:{
      type:Boolean,
      default:false
    },
    lastActive:{
      type:Date,
      default:new Date(),
    }
  },
  { timestamps: true }
);

freelancerSchema.pre("save", async function (next) {
  if (!this.isModified("auth_details.password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.auth_details.password = await bcrypt.hash(this.auth_details.password, salt);

  // Generate unique freelancer_id if it doesn't exist
  if (!this.freelancer_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'FRE_LAN-' }); // Generate freelancer_id
      const existingFreelancer = await mongoose.model("freelancers").findOne({ freelancer_id: randomString });

      if (!existingFreelancer) {
        this.freelancer_id = randomString;
        isUnique = true;
      } else {
        retries += 1;
      }
    }

    if (!isUnique) {
      return next(new Error("Failed to generate a unique freelancer ID after several attempts."));
    }
  }

  next();
});

freelancerSchema.methods.isPasswordMatched = async function (inputPassword) {
  return bcrypt.compareSync(inputPassword, this.auth_details.password);
};

freelancerSchema.methods.generatePasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenEncry = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.auth_details.passwordResetToken = passwordResetTokenEncry;
  this.auth_details.passwordResetExpiresAt = Date.now() + 5 * 60 * 1000; // Reset token expires in 5 minutes
  return resetToken;
};

export const freelancerModel = mongoose.model("freelancers", freelancerSchema); // Fixed typo in model name
