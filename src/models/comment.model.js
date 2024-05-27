import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Video } from "./video.model.js";
import { User } from "./user.model.js";

const commentSchema= new Schema({
    content:{
        type:String,
        required:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentSchema)