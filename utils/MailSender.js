import nodeMailer from 'nodemailer'
import asyncHandler from 'express-async-handler';

export const sendMail =asyncHandler(async (data,req,res)=>{
    try {
      const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      
        const info = await transporter.sendMail({
          from: `"Emploez.in" <${data.from}>` , 
          to: data.to, 
          subject: data.subject, 
          text: data.text, 
          html: data.html, 
        });
      
        console.log("Message sent: %s", info.messageId);
      
    } catch (error) {
      
      throw new Error(error)
    }
  
  })

  export const sendMailInGroup =asyncHandler(async (data,req,res)=>{
    try {
      const transporter = nodeMailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_ID,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      
        const info = await transporter.sendMail({
          from: `"Emploez.in" <${data.from}>` , 
          to: data.to, 
          cc:data.cc,
          bcc:data.bcc,
          subject: data.subject, 
          text: data.text, 
          html: data.html, 
        });
      
        console.log("Message sent: %s", info.messageId);
      
    } catch (error) {
      
      throw new Error(error)
    }
  
  })