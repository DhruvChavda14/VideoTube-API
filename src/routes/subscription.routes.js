import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Router } from "express"

const router = Router()
router.use(verifyJWT)
router.route("/c/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription)
router.route("/u/:subscriberId").get(getSubscribedChannels)

export default router