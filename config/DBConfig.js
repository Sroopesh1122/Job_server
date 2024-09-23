import  mongoose from 'mongoose'

export const DBConnection =async()=>{
    try {
        await mongoose.connect(process.env.DB_URL,{useNewUrlParser: true,useUnifiedTopology: true,})
        console.log("DB connected") 

    } catch (error) {
        console.log(error)
    }
}

