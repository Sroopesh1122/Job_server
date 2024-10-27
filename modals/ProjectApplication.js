import mongoose from "mongoose";
import { getRandomIds } from "../utils/generateRandomIds.js";

const projectApplicationSchema = new mongoose.Schema({
  project_id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  cost: {
    amount: { type: Number, required: true },
  },
  dueTime: {
    type: Date,
  },
  provider: {
    type: String ,
  },
  applied_ids: [{ type: String }],
  skills:[{type:String}]
}, {
  timestamps: true,
});

projectApplicationSchema.pre("save", async function (next) {
  if (!this.project_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5; 

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'PROJECT-' });

      const existingApplication = await ProjectApplicationModal.findOne({ project_id: randomString });

      if (!existingApplication) {
        this.project_id = randomString; 
        isUnique = true; 
      } else {
        retries += 1; 
      }
    }

    if (!isUnique) {
      return next(new Error('Failed to generate a unique project ID after several attempts.'));
    }
  }
  next();
});

export const ProjectApplicationModal = mongoose.model("projects", projectApplicationSchema);
