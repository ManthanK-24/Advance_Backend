import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req,resp)=>{
    
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    //upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return resp 

    const {fullName, email, username ,password} = req.body;
    //console.log("req.body:",req.body);
    
    // console.log(email);

    if(!fullName || !username || !email || !password) {
        throw new ApiError(400, "All fields are required!");
      }
    
    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })
   // console.log("existedUser:",existedUser);
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;

    if(req.files && req.files.coverImage && req.files.coverImage.length>0)
    coverImageLocalPath = req.files.coverImage[0].path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar)
    {
        throw new ApiError(400,"Avatar file is required")
    }

    // if any err comes will be handle by asyncHandler
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
  //  console.log("user:",user);
    //check if user entry completed in DB
    const userCreatedInDB = await User.findById(user._id).select(
        "-password -refreshToken" // exclude these fields
    )
  //  console.log("userCreatedInDB:",userCreatedInDB)
    
    if(!userCreatedInDB){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    
    const tmp =  resp.status(201).json(
        new ApiResponse(200,userCreatedInDB,"User registered successfully")
    )
   // console.log("tmp:",tmp)
    return tmp
})


export {
    registerUser,
}