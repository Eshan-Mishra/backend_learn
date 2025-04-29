import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlerware.js";
import { upload } from "../middlewares/multer.middlerware.js";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();
router.use(verifyJwt);

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "video",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo
  );


router
  .route("/:videoId")
  .get(getVideoById)
  .patch(upload.single("thumbnail"),updateVideo)
  .delete(deleteVideo)


router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;
