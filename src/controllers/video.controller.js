import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteOnCloudinary,
  updatedOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;

  if (
    [title, description].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user is authenticated
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  // Validate user ID
  if (!isValidObjectId(req.user._id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Properly extract file paths from multer upload
  const localVideoPath = req.files?.video?.[0]?.path;
  const localThumbnailPath = req.files?.thumbnail?.[0]?.path;

  if (!localVideoPath || !localThumbnailPath) {
    throw new ApiError(400, "Video and thumbnail files are required");
  }

  const videoFile = await uploadOnCloudinary(localVideoPath);
  const thumbnailFile = await uploadOnCloudinary(localThumbnailPath);

  if (!videoFile) {
    throw new ApiError(400, "Unable to upload video");
  }
  if (!thumbnailFile) {
    throw new ApiError(400, "Unable to upload thumbnail");
  }

  const duration = videoFile.duration;

  const createdVideoFile = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    description,
    duration,
    isPublished,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, createdVideoFile, "Video uploaded successfully")
    );
});

const getAllVideos = asyncHandler(async (req, res) => {
  // Query parameters extract kar rahe hain — ya default values set kar rahe hain
  const {
    page = 1, // Page number, default is 1
    limit = 10, // Items per page, default is 10
    query = "", // Search query string, default is empty
    sortBy = "createdAt", // Kis field pe sort karna hai (default: createdAt)
    sortType = "desc", // Ascending ya descending order (default: descending)
    userId, // Optional: kisi specific user ke videos lane ho to
  } = req.query;

  // Auth check — agar user login nahi hai to error throw karo
  if (!req.user) {
    throw new ApiError(401, "User needs to be logged in");
  }

  // MongoDB aggregation pipeline banate hain
  const pipeline = [];

  // 1️⃣ Match stage: Filters apply kar rahe hain (search & userId)
  const matchStage = {
    $match: {
      isPublished: true, // Sirf published videos fetch karne hain

      // Agar query string hai to uske basis pe title me search karo (case-insensitive)
      ...(query && {
        title: { $regex: query, $options: "i" },
      }),

      // Agar userId diya gaya ho to us user ke videos hi fetch karo
      ...(userId && {
        owner: new mongoose.Types.ObjectId(userId),
      }),
    },
  };

  pipeline.push(matchStage); // Match stage ko pipeline me add kar diya

  // 2️⃣ Lookup stage: users collection se owner info join kar rahe hain
  pipeline.push({
    $lookup: {
      from: "users", // "users" collection se data lana hai
      localField: "owner", // Video ke owner field ko match karna hai
      foreignField: "_id", // Users collection ke _id se
      as: "ownerDetails", // Join hone wala data "ownerDetails" array me store hoga
      pipeline: [
        // Sirf required fields fetch karne ke liye inner pipeline
        {
          $project: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      ],
    },
  });

  // 3️⃣ Unwind stage: ownerDetails ek array hai, usko single object me convert karna
  pipeline.push({
    $unwind: "$ownerDetails",
  });

  // 4️⃣ Project stage: Sirf zaroori fields select karna jo client ko bhejni hain
  pipeline.push({
    $project: {
      videoFile: 1, // Video file URL
      thumbnail: 1, // Thumbnail image
      title: 1, // Title of the video
      description: 1, // Description of the video
      duration: 1, // Video length in seconds
      views: 1, // Total views
      isPublished: 1, // Publish status
      createdAt: 1, // Created date
      owner: "$ownerDetails", // Owner info as a single object
    },
  });

  // 5️⃣ Sort stage: Kis field ke basis pe sort karna hai (asc ya desc)
  pipeline.push({
    $sort: {
      [sortBy]: sortType === "desc" ? -1 : 1, // Conditional sorting
    },
  });

  // 6️⃣ Pagination apply karna using aggregatePaginate plugin
  const videoAggregate = await Video.aggregate(pipeline); // Aggregate query banayi
  const options = {
    page: parseInt(page, 10), // Page number
    limit: parseInt(limit, 10), // Limit per page
  };

  // Plugin ke through paginated result fetch kar rahe hain
  const videos = await Video.aggregatePaginate(videoAggregate, options);

  // Final response send kar rahe hain client ko
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  const user_id = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  if (!isValidObjectId(user_id)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const videoFile = await Video.findOne({
    _id: videoId,
    owner: user_id,
  });

  const updateData = {};

  if (!videoFile) {
    throw new ApiError(403, "User is not the owner of the video");
  }

  if (title && title.trim() !== "") {
    updateData.title = title;
  }
  if (description && description.trim() !== "") {
    updateData.description = description;
  }

  if (req.file) {
    const localThumbnailPath = req.file.path;

    if (!localThumbnailPath) {
      throw new ApiError(400, "thumbnail file is missing");
    }

    const thumbnail = await updatedOnCloudinary(
      localThumbnailPath,
      videoFile.thumbnail
    );

    if (!thumbnail) {
      throw new ApiError(400, "error updating thumbnail");
    }

    updateData.thumbnail = thumbnail.url;
  }

  const updatedVideoFile = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedVideoFile) {
    throw new ApiError(400, "error updating videoDetails");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideoFile, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(401, "Unauthorized request");
  }

  const videoFile = await Video.findOne({
    _id: videoId,
    owner: userId,
  });

  if (!videoFile) {
    throw new ApiError(403, "User is not the owner of the video");
  }

  try {
    // First delete the files from cloudinary
    await deleteOnCloudinary(videoFile.videoFile);
    await deleteOnCloudinary(videoFile.thumbnail);

    // Then delete the database record
    const deletedVideoFile = await Video.findByIdAndDelete(videoId);

    if (!deletedVideoFile) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, deletedVideoFile, "Video deleted successfully")
      );
  } catch (error) {
    console.error("Error during video deletion:", error);
    throw new ApiError(
      500,
      "Error deleting video: " + (error.message || "Unknown error")
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const userId = req.user?._id;

  if (!videoId) {
    throw new ApiError(400, "videoId required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid videoId ");
  }
  if (!userId) {
    throw new ApiError(400, "videoId required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "invalid videoId ");
  }

  const video = await Video.findOne({
    _id: videoId,
    owner: userId,
  });

  if (!video) {
    throw new ApiError(400, "user id not the owner of video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
