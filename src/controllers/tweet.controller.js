import { Tweet } from "../models/Tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose, { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const owner = req.user?._id;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }
  if (!owner) {
    throw new ApiError(401, "Authentication required");
  }
  if (!isValidObjectId(owner)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const tweet = await Tweet.create({
    content,
    owner,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to create tweet");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, "No tweets found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const owner = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID format");
  }
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required");
  }
  if (!isValidObjectId(owner)) {
    throw new ApiError(401, "Authentication required");
  }

  const tweet = await Tweet.findOne({
    _id: tweetId,
    owner,
  });
  if (!tweet) {
    throw new ApiError(403, "You don't have permission to update this tweet");
  }
  tweet.content = content;

  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const owner = req.user?._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID format");
  }
  if (!isValidObjectId(owner)) {
    throw new ApiError(401, "Authentication required");
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner,
  });
  if (!tweet) {
    throw new ApiError(403, "You don't have permission to delete this tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
