import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const providerSchema = new mongoose.Schema(
  {
    company_name: {
      required: true,
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
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
      type: Number,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v.toString());
        },
        message: (props) => `${props.value} is not a valid mobile number!`,
      },
    },
    auth_details: {
      role: {
        type: String,
        default: "provider",
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
    job_details: {
      jobs:[
        {
          type:mongoose.Types.ObjectId,
          ref:"applications"
        }
      ],
      projects:[
        {
          type:mongoose.Types.ObjectId,
          ref:"projects"
        }
      ],
      
    },
  },
  { timestamps: true }
);

providerSchema.pre("save", async function (next) {
  if (!this.isModified("auth_details.password")) {
    next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.auth_details.password = await bcrypt.hash(
    this.auth_details.password,
    salt
  );
});

providerSchema.methods.isPasswordMatched = async function (inputPassword) {
  return bcrypt.compareSync(inputPassword, this.auth_details.password);
};

providerSchema.methods.generatePasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenEncry = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.auth_details.passwordResetToken = passwordResetTokenEncry;
  this.auth_details.passwordResetExpiresAt = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

export const providerModal =  mongoose.model("providers", providerSchema);
