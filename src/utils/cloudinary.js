import {v2 as cloudinary} from "cloudinary";
import fs from "fs";  // filesystem nodejs


          
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
        console.log("File is uploaded on cloudinary",response.url);
        return response;
    } catch (error) {
            // Sync is used as we will proceed only after file is unlinked
            fs.unlinkSync(localFilePath); // removes locally saved temp file as file upload failed
            return null;
    }
}


export {uploadOnCloudinary};