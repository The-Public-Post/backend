import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto", // image, video, pdf
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      )
      .end(file.buffer);
  });
};
