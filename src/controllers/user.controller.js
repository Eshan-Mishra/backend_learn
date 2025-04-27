import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import {
  updatedOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating refersh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user detail from frontend
  // validation , not empty fields
  // check if user already exist check from username and email
  // check for images and avatar
  // upload them to cloudinary , check avatar
  // create entry in db
  // remove password and refresh token field from response
  // check user creation
  // return response

  const { fullName, email, username, password } = req.body;

  // if(fullName===""){
  //     throw new ApiError(400,"fullName is required")
  // }

  if (
    [fullName, email, username, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with email and username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  //   let coverImageLocalPath;

  //   if (
  //     req.files &&
  //     Array.isArray(req.files.coverImage) &&
  //     req.files.coverImage.length > 0
  //   ) {
  //     coverImageLocalPath = req.files?.coverImage[0]?.path;
  //   }else
  //   {
  //     coverImageLocalPath = "";
  //   }

  console.log(req.files);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Worng While Registering The User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registerd Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req-> data
  // usernaem or email
  // find the user
  // check the password
  // access and refersh token
  // send cookies

  const { email, username, password } = req.body;
  //   console.log(req.body)
  //   console.log("email: ", email);
  //   console.log("username : ", username);

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required ");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user doesnt exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials ");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await user.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully "
      )
    );
});
 
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //req.body mai se refresh tocken lo agar match kiya tho access token generate karo aur pass karo

  const incomingRefreshTocken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshTocken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshTocken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh tocken");
    }

    if (incomingRefreshTocken !== user?.refreshToken) {
      throw new ApiError(401, "refresh tocken is expired or used ");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    console.log(refreshToken);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newpassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid old password");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

const updatedAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "all feilds are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

const updatedUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const user = req.user;
  const oldAvatarUrl = user.avatar;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required ");
  }
  if (!oldAvatarUrl) {
    throw new ApiError(500, "can not find old avatar image");
  }

  const newAvatar = await updatedOnCloudinary(avatarLocalPath, oldAvatarUrl);

  if (!newAvatar) {
    throw new ApiError(500, "issue while updating Avatar");
  }

  user.avatar = newAvatar.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, newAvatar.url, "Avatar updated successfully"));
});

const updatedUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  const user = req.user;
  const oldCoverImageUrl = user.coverImage || "";

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage image is required ");
  }
  // if(!oldCoverImageUrl){
  //   throw new ApiError(500, "can not find old avatar image");
  // }

  const newCoverImage = await updatedOnCloudinary(
    coverImageLocalPath,
    oldCoverImageUrl
  );

  if (!newCoverImage) {
    throw new ApiError(500, "issue while updating Cover Image");
  }

  user.coverImage = newCoverImage.url;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newCoverImage.url,
        "cover image updated successfully"
      )
    );
});

const getUserChanelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing ");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subcribers",
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subcribers",
        as: "subcribesTo",
      },
    },
    {
      $addFields: {
        subcribersCount: {
          $size: "$subcribers",
        },
        channelsSubcribedToCount: {
          $size: "$subcribesTo",
        },
        isSubcribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subcribers.subcribers"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subcribersCount: 1,
        channelsSubcribedToCount: 1,
        isSubcribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "channel does not exist ");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched succeessfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId.createFromHexString(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                  }
                }
              ]
            },
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ],
      },
    },
    
  ]);


  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully"
    )
  )
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatedAccountDetails,
  getCurrentUser,
  changeCurrentPassword,
  updatedUserAvatar,
  updatedUserCoverImage,
  getUserChanelProfile,
  getWatchHistory,
};
