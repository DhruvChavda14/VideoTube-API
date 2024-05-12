import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comments.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { parse } from "dotenv";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query
    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Invalid video Id")

    const video = await Video.findById(videoId)
    if (!video)
        throw new ApiError(404, "Video not found")

    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                        }
                    }
                ]
            }
        },
        {
            $skip: pageSkip
        },
        {
            $limit: parsedLimit
        }
    ])

    if (!comments || comments.length === 0)
        throw new ApiError(404, "Comments not found")

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments found successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId))
        throw new ApiError(400, "Invalid video id")

    if (!content)
        throw new ApiError(400, "content is required")

    const videoFound = await Video.findById(videoId)

    if (!videoFound)
        throw new ApiError(404, "Video not found")

    const comments = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoFound?._id
    })

    if (!comments)
        throw new ApiError(400, "Could not create comment")

    return res.status(200).json(new ApiResponse(200, comments, "comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId))
        throw new ApiError(400, "comment id invalid")

    if (!content)
        throw new ApiError(400, "content is required")

    const commentFound = await Comment.findById(commentId)

    if (!(commentFound.owner.toString() === req.user?._id.toString()))
        throw new ApiError(400, "only login user can update")

    try {
        const updatedComment = await Comment.findByIdAndUpdate(commentId,
            {
                $set: {
                    content: content,
                    owner: req.user?._id
                }
            }, { $new: true }
        )

        if (!updatedComment)
            throw new ApiError(400, "Could not update comment")

        return res
            .status(200)
            .json(new ApiResponse(200, updatedComment, "comment updated successfully"))

    } catch (error) {
        throw new ApiError(401, error?.message || "comment cannot be updated")
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!isValidObjectId(commentId))
        throw new ApiError(400, "Invalid comment id")

    const commentFound = await Comment.findById(commentId)

    if (!(commentFound.owner.toString() === req.user?._id.toString()))
        throw new ApiError(400, "only login user can delete comment")

    const deletion = await Comment.findByIdAndDelete(commentId)

    if (!deletion)
        throw new ApiError(400, "could not delete comment")

    return res
        .status(200)
        .json(new ApiResponse(200, deletion, "comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}