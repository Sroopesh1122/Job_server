import mongoose from "mongoose";


const applicationSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trime:true
    },
    description:{
        type:String,
        required:true,
        trime:true
    },
    salary:{
        amount:{type:Number , required:true},
        unit : {type:String , required:true}
    },
    qualification:{
        type:String,
        required:true
    },
    provider_details :{
        type : mongoose.Types.ObjectId,
        ref:"providers"
    }
},{
    timestamps:true
})


export const jobApplicationModal = mongoose.model("applications",applicationSchema)