import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlerware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/").post(createTweet);

router.route("/user/:userId").get(getUserTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
