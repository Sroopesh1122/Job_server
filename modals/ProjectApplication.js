import mongoose from "mongoose";


const projectApplicationSchema = new mongoose.Schema({
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
    cost:{
        amount:{type:Number , required:true},
    },
    dueTime:{
        type:Date,
    },
    provider:{
        type:mongoose.Types.ObjectId,
        ref:"providers"
    }
},{
    timestamps:true
})


export const ProjectApplicationModal = mongoose.model("projects",projectApplicationSchema)