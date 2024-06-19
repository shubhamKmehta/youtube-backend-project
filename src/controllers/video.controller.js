import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import jwt from "jsonwebtoken"

const getAllVideo=asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortby,sortType,userId}=req.query

    if(!userId){
        throw new ApiError(400,"user information not available")
    }
    
})






export { getAllVideo }