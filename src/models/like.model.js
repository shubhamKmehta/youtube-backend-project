import mongoose,{Schema} from "mongoose";
import { Video } from "./video.model.js";
import { Comment } from "./comment.model.js";
import { Tweet } from "./tweets.model.js"
import { User } from "./user.model.js";


const likeSchema=new Schema({
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps})


export const Like=mongoose.model("Like",likeSchema)