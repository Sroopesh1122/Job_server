import mongoose from "mongoose";
import { getRandomIds } from "../utils/generateRandomIds.js";

const ReportsSchema = new mongoose.Schema({
  report_id: {
    type: String,
  },
  reportedBy:{
    type:String,
  },
  reportedTo:{
    type:String
  },
  content:{
    type:String
  },
  postId:{
    type:String
  },
  reportFor:{
    type:String,
    enum:['user','provider','freelancer']
  }
}, {
  timestamps: true,
});

ReportsSchema.pre("save", async function (next) {
  if (!this.report_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5; 

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'REPORT-' });

      const existingNotification = await await mongoose.model("reports").findOne({report_id :randomString})

      if (!existingNotification) {
        this.report_id = randomString; 
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

export const ReportModal = mongoose.model("reports", ReportsSchema);
