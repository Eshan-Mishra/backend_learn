import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updatedAccountDetails,
  updatedUserAvatar,
  updatedUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlerware.js";
import { verifyJwt } from "../middlewares/auth.middlerware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes

router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/update-account-details").patch(verifyJwt, updatedAccountDetails)
router.route("/change-password").patch(verifyJwt, changeCurrentPassword)
router.route("/change-avatar").patch(
  verifyJwt,
  upload.single("avatar"),
  updatedUserAvatar
)
router.route("/change-cover-image").patch(
  verifyJwt,
  upload.single("coverImage"),
  updatedUserCoverImage
)

export default router;
