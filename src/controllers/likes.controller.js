import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Likes } from "../models/likes.model.js";
import mongoose, { Schema, isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comments.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Invalid video id")

    try {
        const video = await Video.findById(videoId)
        if (!video || (video.owner.toString() !== req.user?._id.toString() && !video.isPublished))
            throw new ApiError(404, "Video not found")

        const likeCriteria = {
            video: videoId,
            likedBy: req.user?._id
        }

        const alreadyLiked = await Likes.findOne(likeCriteria)

        if (!alreadyLiked) {
            const newLike = await Likes.create(likeCriteria)
            if (!newLike)
                throw new ApiError(400, "could not add new like")

            return res
                .status(200)
                .json(new ApiResponse(200, newLike, "toggled successfully"))
        }

        const dislike = await Likes.deleteOne(likeCriteria)

        if (!dislike)
            throw new ApiError(400, "unable to dislike")

        return res.status(200).json(new ApiResponse(200, dislike, "Video disliked successfully"))

    } catch (error) {
        throw new ApiError(500, error?.message || "some error occured while toggling")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId))
        throw new ApiError(400, "Invalid comment id")

    const commentFound = await Comment.findById(commentId)
    if (!commentFound || (commentFound.owner.toString() !== req.user?._id.toString()) && commentFound.length !== 0)
        throw new ApiError(404, "Comment not found")

    const likeCriteria = { comment: commentId, likedBy: req.user?._id }
    const alreadyLiked = await Likes.findOne(likeCriteria)
    if (!alreadyLiked) {
        const newLike = await Likes.create(likeCriteria)
        if (!newLike)
            throw new ApiError(400, "unable to like")

        return res
            .status(200)
            .json(new ApiResponse(200, newLike, "new comment liked successfully"))
    }

    const dislike = await Likes.deleteOne(likeCriteria)
    if (!dislike)
        throw new ApiError(400, "unable to dislike")

    return res
        .status(200)
        .json(new ApiResponse(200, dislike, "comment disliked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    if (!isValidObjectId(tweetId))
        throw new ApiError(400, "invalid tweet id")

    const tweet = await Tweet.findById(tweetId)
    if (!tweet || (tweet.owner.toString() !== req.user?._id.toString()))
        throw new ApiError(404, "tweet not found")

    const likeCriteria = { tweet: tweetId, likedBy: req.user?._id }
    const alreadyLiked = await Likes.findOne(likeCriteria)
    if (!alreadyLiked) {
        const newlike = await Likes.create(likeCriteria)
        if (!newlike)
            throw new ApiError(400, "unable to like")

        return res
            .status(200)
            .json(new ApiResponse(200, newlike, "tweet liked successfully"))
    }

    const dislike = await Likes.deleteOne(likeCriteria)
    if (!dislike)
        throw new ApiError(400, "unable to dislike")

    return res.status(200).json(new ApiResponse(200, dislike, "tweet disliked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    console.log(userId)
    if (!isValidObjectId(userId))
        throw new ApiError(400, "Invalid user id")

    const likedVideos = await Likes.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $match: {
                "likedVideos.isPublished": true
            }
        },
        {
            $lookup: {
                from: "users",
                let: { owner_id: "$likedVideos.owner" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$owner_id"] }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ],
                as: "owner"
            }
        },
        {
            $unwind: { path: "$owner", preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                _id: "$likedVideos._id",
                title: "$likedVideos.title",
                thumbnail: "$likedVideos.thumbnail",
                owner: {
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    fullName: "$owner.fullName"
                }
            }
        },
        {
            $group: {
                _id: null,
                likedVideos: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                likedVideos: 1
            }
        }
    ]);
    if (!likedVideos)
        throw new ApiError(400, "unable to fetch liked videos")

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Successfully fetched liked videos"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}