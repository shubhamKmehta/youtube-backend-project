import { Router } from "express";
import { getAllVideo } from "../controllers/video.controller.js";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {upload} from "../middlewares/multer.middleware.js"


const router=Router();


router.use(verifyJWT)

router.route("/").get(getAllVideo).post(
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ])
)





export default router;