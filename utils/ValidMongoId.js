import mongoose from "mongoose"


export const validateMongoId = (id)=>{
    return mongoose.Types.ObjectId.isValid(id)
}