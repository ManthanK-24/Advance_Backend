import {v2 as cloudinary} from "cloudinary";
import fs from "fs";  // filesystem nodejs
import { ApiError } from "./ApiError.js";


          
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY , 
  api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath)return null
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });
        fs.unlinkSync(localFilePath);
      //  console.log("File is uploaded on cloudinary",response.url);
        return response;
    } catch (error) {
            // Sync is used as we will proceed only after file is unlinked
            fs.unlinkSync(localFilePath); // removes locally saved temp file as file upload failed
            return null;
    }
}

const deleteOnCloudinary = async(cloudinary_public_id) =>{
    try {
        await cloudinary.uploader.destroy(cloudinary_public_id);
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating Image File")
    }
}


export {uploadOnCloudinary,deleteOnCloudinary};