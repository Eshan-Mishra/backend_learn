import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(Url) {
  const regex = /upload\/v\d+\/(.+?)\.(?:jpg|jpeg|png|webp|gif|bmp|tiff)$/i;
  const match = Url.match(regex);
  return match ? match[1] : null;
}

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    return null;
  }
};

const updatedOnCloudinary = async (newLocalFilePath, oldFileUrl) => {
  try {
    if (
      [newLocalFilePath, oldFileUrl].some((fields) => {
        return fields?.trim() === "";
      })
    ) {
      throw new ApiError(400, "All fields are required for updating media");
    }

    const publicId = extractPublicId(oldFileUrl);

    if (!publicId) {
      throw new ApiError(400, "Could not find the public ID");
    }

    const response = await cloudinary.uploader.upload(newLocalFilePath, {
      public_id: publicId,
      overwrite: true,
    });

    console.log("file is updated on cloudinary", response.url);
    fs.unlinkSync(newLocalFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(newLocalFilePath);
    return null;
  }
};

const deleteOnCloudinary = async (public_url) => {
  try {
    if (!public_url.trim()) {
      throw new ApiError(400, "public url required");
    }

    const public_id = extractPublicId(public_url);

   await cloudinary.uploader.destroy(public_id, {
      resource_type: "auto",
    });

    return true;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, updatedOnCloudinary, deleteOnCloudinary };
