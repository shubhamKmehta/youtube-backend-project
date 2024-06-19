import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken"


const generateAcessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save( {validateBeforeSave :false})

        return {refreshToken,accessToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}



const registerUser=asyncHandler(async (req,res)=>{
    const {fullname,username,email,password}= req.body
    console.log("email : ",email)
    // console.log("password : ",password)
    // console.log("username : ",username)

    // check all validation like this,using multiple if block or

    // if (fullname == "") {
    //     throw new ApiError(400,"fullname is required");
    // }

    if(
        [fullname,username,email,password].some((field)=> field?.trim() === "" )  // agr field  haie("?") to usko trim kr dijye,trim krne ke bad v agr empty rhta h to automatically true return hoga.
    ){
        throw new ApiError(400,"All fields are compulsory")
    }   

    const existedUser = await User.findOne({
        $or:[{ username },{ email }]
    })
    console.log("existedUser:",existedUser)

    if(existedUser){
        throw new ApiError(409,"User with username or email are alreay exist")
    }

    console.log("requested files :-",req.files)

    const avatarlocalPath= req.files?.avatar[0]?.path;
    console.log("avatarlocalPath :-",avatarlocalPath);

    // const coverImageLocalPath= req.files?.coverImage[0]?.path

    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar files is requried")
    }
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }


    const avatar= await uploadOnCloudinary(avatarlocalPath)

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar files are required");
    }

    
    // if(!coverImage){
    //     throw new ApiError(400,"CoverImage files are required");
    // }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url||"",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw  new ApiError(500,"Something went wrong while registering the new user")
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User created successfully"
        )
    )

})

const loginUser=asyncHandler( async (req,res)=>{
    // req.body-->data
    //username or email
    // find user 
    // check password
    // access and refresh token generate
    // send cookie
    // return res.

    const {email,username,password} = req.body;

    if(!(username || email)){
        throw new ApiError(400,"username or email are required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"password is incorrect")
    }
    const {accessToken,refreshToken}= await generateAcessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")


    // now send cookies

    const options={
        httpOnly:true,
        secure:true
    }
    console.log("options:-",options)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "user logged In Successfully"
        )
    )
})


const logoutUser= asyncHandler(async(req,res)=>{
       await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset:{
                    refreshToken:1  // this remove the field from the document.
                }
            },
            {
                new:true
            }
        )

        const options={
            httpOnly:true,
            secure:true
        }

        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(
            200,
            {},
            "User logout successfully"
        ))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user =await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401," Invalid  refresh token ")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token are expired or used")
        }
        
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {newAccessToken,newRefreshToken}=await generateAcessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",newAccessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken:newAccessToken ,refreshToken:newRefreshToken
                },
                "Access token refreshed"
            )
        )  
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
        
    }  

})



const changeCurrentPassword = asyncHandler( async (req,res) => {
    const { oldPassword,newPassword }= req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password succesfully changed"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;

    if(!(fullname || email)){
        throw new ApiError(400,"AlL fields are requried")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },{
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "ACCOUNT UPDATED SUCCESSFULLY"
    ))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarlocalPath= req.file?.path;

    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarlocalPath)

    if(!avatar){
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Avatar successfully updated"
    ))

})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath);
    
    if(!coverImage){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },{
            new:true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover image successfully updated"
    ))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username){
        throw new ApiError(400,"username not unavailable")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                email:1,
                coverImage:1
            }
        }
    ])

    console.log("aggregate channel :-",channel)
    
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }


    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User channel fetched successfully"
    ))
})


const getWatchHistory= asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId( req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from : "users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
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
    getUserChannelProfile,
    getWatchHistory

}