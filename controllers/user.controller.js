import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser= asyncHandler( async (req,res)=> {
    // get user detail from frontend
    // validation , not empty
    // check if user already exist check from username and email
    // check for images and avatar
    // upload them to cloudinary , check avatar
    // create entry in db
    // remove password and refresh token field from response
    // check user creation
    // return response

    const {fullName,email,username,password}=req.body

    // if(fullName===""){
    //     throw new ApiError(400,"fullName is required")
    // }

    if(
      [fullName,email,username,password].some((field)=>{
          return field?.trim()===""
      })
    ){
        throw new ApiError(400,"all fields are required")
    }

    const existingUser=User.findOne({
        $or :[{username},{email}]
    })

    if(existingUser){
        throw new ApiError(409,'User with email and username already exists')
    }

    const avatarLocalPath=req.files?.avatar[0]?.path

    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const  avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

   const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshTocken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something Went Worng While Registering The User")
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User Registerd Succesfully"
        )
    )
    
    console.log("email: ",email)

    


})





export {registerUser};