import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    console.log(channelId)
    if (!isValidObjectId(channelId))
        throw new ApiError(400, "Invalid channel Id")

    const subscriber = await Subscription.find({
        subscriber: req.user?._id,
        channel: channelId
    })
    let toggle
    if (!subscriber) {
        toggle = await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })
        if (!toggle)
            throw new ApiError(400, "Something went wrong")
        else {
            toggle = await Subscription.findByIdAndDelete(subscriber._id)
        }
    }

    return res.status(200).json(new ApiResponse(200, toggle, "togged successfully"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    console.log(subscriberId)
    if (!isValidObjectId(subscriberId))
        throw new ApiError(400, "Invalid channel id")

    const subscriber = await Subscription.findById(subscriberId)

    if (!subscriber)
        throw new ApiError(404, "subscriber not found")

    const aggregate = [
        {
            $match: {
                subscriber: subscriberId
            }
        }, {
            $group: {
                _id: null,
                totalCount: { $sum: 1 }
            }
        }
    ]
    const subscriberList = await Subscription.aggregate(aggregate)
    if (!subscriberList || subscriberList.length === 0)
        throw new ApiError(404, "Subscribers lsit not found")

    return res
        .status(200)
        .json(new ApiResponse(200, subscriberList, "Subscriber list found successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params
        console.log(channelId)
        if (!isValidObjectId(channelId))
            throw new ApiError(400, "Subscriber Id invalid")
    
        const channel = await Subscription.findById(channelId)
        if (!channel)
            throw new ApiError(404, "Channel not found")
    
        const aggregate = [
            {
                $match: {
                    channel: channelId
                }
            }, {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 }
                }
            }
        ]
        const channelList = await Subscription.aggregate(aggregate)
        if (channelList.length === 0 || !channelList)
            throw new ApiError(404, "channel list not found")
    
        return res
            .status(200)
            .json(new ApiResponse(200, channelList, "Channel list found successfully"))
    } catch (error) {
        console.log(error)
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}