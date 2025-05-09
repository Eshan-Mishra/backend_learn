import mongoose, { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      index: true,
      trim: true,
    },
    description: {
      type: String,
      require: true,
      trim: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
