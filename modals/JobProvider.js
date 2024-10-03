import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const providerSchema = new mongoose.Schema(
  {
    company_id: {
      type: String,
      unique: true,
    },
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
    img: {
      url: { type: String, default: "https://wheretocart.com/assets/images/business-image/business-default.jpg" }
    },
    mobile: {
      type: String, // Changed to String for flexibility
      unique: true,
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
        enum: ["provider", "admin", "user"], // Added enum for roles
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
    company_links: [{ // Consistent naming
      title: { type: String },
      url: { type: String }
    }],
    job_details: {
      jobs: [
        {
          jobId: { type: String},
        },
      ],
    },
  },
  { timestamps: true }
);

providerSchema.pre("save", async function (next) {
  if (!this.isModified("auth_details.password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.auth_details.password = await bcrypt.hash(this.auth_details.password, salt);

  // Generate unique company_id if it doesn't exist
  if (!this.company_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'COMP-' }); // Generate company_id
      const existingCompany = await mongoose.model("providers").findOne({ company_id: randomString });

      if (!existingCompany) {
        this.company_id = randomString;
        isUnique = true;
      } else {
        retries += 1;
      }
    }

    if (!isUnique) {
      return next(new Error("Failed to generate a unique company ID after several attempts."));
    }
  }

  next();
});

providerSchema.methods.isPasswordMatched = async function (inputPassword) {
  return  bcrypt.compareSync(inputPassword, this.auth_details.password)
};

providerSchema.methods.generatePasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetTokenEncry = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.auth_details.passwordResetToken = passwordResetTokenEncry;
  this.auth_details.passwordResetExpiresAt = Date.now() + 30 * 60 * 1000; // Configurable expiration logic can be added here
  return resetToken;
};

export const providerModal = mongoose.model("providers", providerSchema); // Fixed typo in model name
