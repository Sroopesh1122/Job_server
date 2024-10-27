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
          from: '"Emploez.in"' , // sender address
          to: data.to, // list of receivers
          subject: data.subject, // Subject line
          text: data.text, // plain text body
          html: data.html, // html body
        });
      
        console.log("Message sent: %s", info.messageId);
      
    } catch (error) {
      
      throw new Error(error)
    }
  
  })