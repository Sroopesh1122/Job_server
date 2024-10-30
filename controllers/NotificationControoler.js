import asyncHandler from "express-async-handler";
import { NotificationModal } from "../modals/Notitfication.js";


export const readNotification= asyncHandler(async(req,res)=>{
  const {notification_id}= req.body;
  if(!notification_id)
  {
    throw new Error("Notification id required!")
  }
  const notification = await NotificationModal.findOne({notification_id})
  if(!notification)
  {
    throw new Error("Notification not Found")
  }

  notification.read = true;
  await notification.save();
  res.json({success:true})
})

export const deleteNotification= asyncHandler(async(req,res)=>{
  const {notification_id}= req.query;
  if(!notification_id)
  {
    throw new Error("Notification id required!")
  }
  const notification = await NotificationModal.deleteOne({notification_id})
  if(!notification)
  {
    throw new Error("Notification not Found")
  }
  res.json({success:true})
})

export const getAllNotification= asyncHandler(async(req,res)=>{
  const {receiver_id}= req.query;
  if(!receiver_id)
  {
    throw new Error("Receiver Id Required!")
  }
  const query=[];
  const matchStage={}
  matchStage.receiver = receiver_id;
  query.push({$match:matchStage})
  query.push({$sort:{createdAt:-1}})
  const notifications = await NotificationModal.aggregate(query)
  res.json(notifications)
})

