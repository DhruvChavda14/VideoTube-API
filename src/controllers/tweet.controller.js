import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if (!content)
        throw new ApiError(400, "content is required")

    const newTweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if (!newTweet)
        throw new ApiError(400, "Tweet not created")

    return res.status(200).json(new ApiResponse(200, newTweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!isValidObjectId(userId))
        throw new ApiError(400, "invalid user id")

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }, {
            $project: {
                content: 1,
                _id: 1
            }
        }
    ]

    const tweets = await Tweet.aggregate(pipeline)

    if (tweets.length == 0)
        return res.status(200).json(new ApiResponse(200, tweets, "No tweet was found"))

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets found successfully"))
})

const updateTweets = asyncHandler(async(req,res)=>{
    const {tweetId}  = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId))
        throw new ApiError(400,"Invalid tweet id")

    if(!content)
        throw new ApiError(400,"Content is required")

    const updateTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content,
            }
        }, { $new: true }
    )

    if(!updateTweet)
        throw new ApiError(400,"Tweet not updated")

    return res.status(200).json(new ApiResponse(200,updateTweet,"Tweets updated successfully"))
})

const deleteTweets = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId))
        throw new ApiError(400,"Invalid tweet id")

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId, { $new: true })
    if(!deleteTweet)
        throw new ApiError(400,"Tweet not deleted")
    return res.status(200).json(new ApiResponse(200,deleteTweet,"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweets,
    deleteTweets
}
