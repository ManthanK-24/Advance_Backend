import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
       try {
          const user = await User.findById(userId)
          const accessToken = user.generateAccessToken()
          const refreshToken = user.generateRefreshToken()
          user.refreshToken = refreshToken
          await user.save({ validateBeforeSave: false})
          return {accessToken, refreshToken}
          
       } catch (error) {
          throw new ApiError(500,"Something went wrong while generating access and refresh tokens")
       }
}
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

const loginUser = asyncHandler(async (req,resp)=>{
      // req body -> data 
      // username or email 
      // find the user
      // password check 
      // access and refresh token
      // send cookie
      const {email,username,password} = req.body;

      if(!username && !email){
        throw new ApiError(400, "Username or email is required")
      }
      const userExist = await User.findOne({
        $or:[{username},{email}]
      })
      if(!userExist){
        throw new ApiError(404,"User do not exist");
      }

      const isPasswordValid = await userExist.isPasswordCorrect(password);

      if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
      }

      const {accessToken,refreshToken} = 
      await generateAccessAndRefreshTokens(userExist._id);
      //console.log("accessToken:",accessToken);
     // console.log("refreshToken:",refreshToken);

      const loggedInUser = await User.findById(userExist._id)
      .select("-password -refreshToken")
      userExist.refreshToken = refreshToken;
     userExist.accessToken = accessToken;
    // console.log("loggedInUser:",loggedInUser);
    // console.log("user:",userExist);

     // to ensure cookies modifiable from server only  
     const options = {
        httpOnly:true,
        secure:true
       }

       return resp.status(200).
       cookie("accessToken",accessToken,options)
       .cookie("refreshToken",refreshToken,options)
       .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
            )
       );
})

const logoutUser = asyncHandler(async (req,resp)=>{
      await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true // response will new val with updated refreshToken
        }
      )
      const options = {
        httpOnly:true,
        secure:true
       }
       return resp
       .status(200)
       .clearCookie("accessToken")
       .clearCookie("refreshToken")
       .json(new ApiResponse(200,{},"User Logged Out"))
});

const refreshAccessToken = asyncHandler(async (req,resp)=>{
    const incomingRefreshToken = req.cookies.refreshToken || 
    req.body.refreshAccessToken  // for mobile kind of devices

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request") 
        // throw err because it's better than getting 200 response and app not working
    }

   try {
     const decodedToken = jwt.verify(incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401, "Invalid refresh token") 
         // throw err because it's better than getting 200 response and app not working
     }
 
     if(incomingRefreshToken!==user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used") 
     }
     const options = {
         httpOnly:true,
         secure:true
        }
 
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return resp
        .status(200)
        .Cookie("accessToken",accessToken,options)
        .Cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"Access Token Refreshed"))
   } catch (error) {
       throw new ApiError(401,error?.message || "Invalid refresh token")
   }

})

const changeCurrentPassword = asyncHandler(async(req,resp)=>{
    // auth user will be handle at middleware
    // so if user reaches here, user is valid user

    const{oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"Invalid Old Password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return resp.status(200)
    .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,reps)=>{
    // add verifyJWT middleware which adds req.user to req

    // const user = await User.findById(req.user?._id)
    // if(!user){
    //     throw new ApiError(400, "Invalid user credentials")
    // }
    return resp
            .status(200)
            .json(new ApiResponse(200,
                                  req.user,
                                  "Current user fetched successfully"
                                  ))
})

const updateAccountDetails = asyncHandler(async(req,resp)=>{
    
    const{fullName, email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email,
            }
        },
        {new:true} // returns updated info
        
    ).select("-password ")    // returns without pass field, here we avoided unnecessary DB call 
   
    return resp
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Account details updated successfully"
                    )
            )
})

const updateUserAvatar = asyncHandler(async(req,resp)=>{
    // verifyJWT middleware
    // then use multer middleware
    // so these method will update avatar of authenticated user

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400,"Error while uploading on avatar")

    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return resp
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "Avatar updated successfully"
                    )
            )
})

const updateUserCoverImage = asyncHandler(async(req,resp)=>{
    // verifyJWT middleware
    // then use multer middleware
    // so these method will update avatar of authenticated user

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400,"Error while uploading on CoverImage")

    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return resp
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "CoverImage updated successfully"
            )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
}