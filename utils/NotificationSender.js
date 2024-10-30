import { NotificationModal } from "../modals/Notitfication.js";

export const sendNotification = async(data)=>{
    const { title="",description="",img="",navigate_link="" ,receiver="" ,sender=""} = data;
    if(!title || !receiver)
    {
      return;
    }
    const notification = await NotificationModal.create({
      title,
      description,
      img,
      navigate_link,
      receiver,
      sender,
    });
  
    return notification;
  };