import mongoose, { Schema } from "mongoose";


const subcriptionSchema=new Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    { timestapms: true }
);



export const Subcription = mongoose.model("Subcription",subcriptionSchema);