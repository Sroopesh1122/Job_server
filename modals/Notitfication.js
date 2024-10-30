import mongoose from "mongoose";
import { getRandomIds } from "../utils/generateRandomIds.js";

const NotificationSchema = new mongoose.Schema({
  notification_id: {
    type: String,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  img:{
    type:"String",
    default:"https://w7.pngwing.com/pngs/881/489/png-transparent-red-bell-notification-thumbnail.png"
  },
  navigate_link:{
    type:String,
    default:""
  },
  receiver: {
    type: String ,
  },
  sender: {
    type: String ,
  },
  read:{
    type:Boolean,
    default:false
  }
}, {
  timestamps: true,
});

NotificationSchema.pre("save", async function (next) {
  if (!this.notification_id) {
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5; 

    while (!isUnique && retries < maxRetries) {
      const randomString = getRandomIds({ prefix: 'NOTIFICATION-' });

      const existingNotification = await await mongoose.model("notifications").findOne({notification_id:randomString})

      if (!existingNotification) {
        this.notification_id = randomString; 
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

export const NotificationModal = mongoose.model("notifications", NotificationSchema);
