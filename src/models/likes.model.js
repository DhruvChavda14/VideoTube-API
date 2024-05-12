import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        comment: {
            type: mongoose.Types.ObjectId,
            ref: "Comment"
        },
        video: {
            type: mongoose.Types.ObjectId,
            ref: "Video"
        },
        tweet: {
            type: mongoose.Types.ObjectId,
            ref: "Tweet"
        },
        likedBy: {
            type: mongoose.Types.ObjectId,
            ref: "User"
        }
    }, { timestamps: true }
)

export const Likes = mongoose.model("Likes", likeSchema)