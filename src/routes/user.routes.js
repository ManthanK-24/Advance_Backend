import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


//secured routes {logged in user }
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken) //we have verified Tokens inside methods only
router.route("/updatePassword").post(verifyJWT,changeCurrentPassword)
router.route("/getUser").get(verifyJWT,getCurrentUser);
router.route("/updateDetails").post(verifyJWT,updateAccountDetails);
router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/updateCoverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

export default router // we can import by any name at other place due to use of default