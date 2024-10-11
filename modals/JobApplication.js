import mongoose from "mongoose";
import { getRandomIds } from "../utils/generateRandomIds.js";
import { parsePackage } from "../utils/commonUtils.js";

const applicationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  job_id: {
    type: String,
    unique: true,
  },
  vacancy: {
    type: Number,
    validate: {
      validator: function (v) {
        return v > 0;
      },
      message: (props) => `${props.value} is not a valid vacancy number!`,
    },
  },
  experience: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  package: {
    min: { type: Number },
    max: { type: Number },
    disclosed: {
      type: Boolean,
      default: true, // Default is true, indicating the package is disclosed
    },
  },
  location: [{
    type: String,
  }],
  qualification: [{
    type: String,
  }],
  specification: [{
    type: String,
  }],
  must_skills: [{ type: String }],
  other_skills: [{ type: String }],
  type: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Hybrid', 'Remote'],
    default: 'Full Time',
  },
  provider_details: {
    type: String,
  },
  applied_ids: [{
    userId: { type: String },
    status: { type: String }
  }],
  saved_ids: [{ type: String }],
  postedBy: {
    type: String,
    default: "admin"
  },
  job_role: {
    type: String
  }
}, {
  timestamps: true,
});

// Middleware to generate a custom job_id starting with "APP-" and with a total length of 12 characters

applicationSchema.pre("save", async function (next) {
  if (!this.job_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;  // limit the number of retries to prevent infinite loops

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'APP-' });

      // Check for uniqueness in the collection
      const existingApplication = await jobApplicationModal.findOne({ job_id: randomString });

      if (!existingApplication) {
        this.job_id = randomString;
        isUnique = true; // Unique ID found
      } else {
        retries += 1; // Increment retries if collision occurs
      }
    }

    if (!isUnique) {
      return next(new Error('Failed to generate a unique job ID after several attempts.'));
    }
  }
    next();
});


export const jobApplicationModal = mongoose.model("applications",applicationSchema)