import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (!(name.trim() !== "") || !(description.trim() !== "")) {
        throw new ApiError(400, "Name or description is not unavailable")
    }

    const user = await User.findById(req.user?._id)
    if (!user) throw new ApiError(404, "user not found")

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    if (!playlist) {
        throw new ApiError(500, "Playlist is not created")
    }

    return res
        .status(200)
        .json(new ApiResponse(201, playlist, "Playlist Created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "User Id is invalid")
    }
    const pipeline = [
        {
            $match: {
                owner: userId
            }
        }
    ]
    const userPlaylist = await Playlist.aggregate(pipeline)
    if (!userPlaylist)
        throw new ApiError(404, "Playlist not found")

    return res
        .status(200)
        .json(new ApiResponse(200, userPlaylist, "Playlist found successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!isValidObjectId(playlistId))
        throw new ApiError(400, "invalid playlist id")
    const playlist = await Playlist.findById(playlistId)
    if (!playlist)
        throw new ApiError(404, "Playlist not found")
    return res.status(200)
        .json(new ApiResponse(200, playlist, "playlist id found successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "playlist id or video id is not valid")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist)
        throw new ApiError(404, "playlist not found")

    const video = await Video.findById(videoId)

    if (!video || !video.isPublished)
        throw new ApiError(404, "video not found")

    playlist.videos.push(videoId)

    const updatedPlaylist = await playlist.save()

    if (!updatedPlaylist)
        throw new ApiError(500, "playlist not updated")

    return res.status(200)
        .json(new ApiResponse(200, updatedPlaylist, "video added to playlist successfully"))

})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist
}