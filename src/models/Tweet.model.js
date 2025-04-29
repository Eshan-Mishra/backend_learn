import mongoose, { Schema } from "mongoose";



const tweetSchema= new mongoose.Schema(
    {
        content:{
            type:String,
            trime:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },{timestamps:true}
)

export const Tweet= mongoose.model("Tweet",tweetSchema)