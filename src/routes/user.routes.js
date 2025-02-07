import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/mutler.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


// multer ka middleware inject kiya before doing registerUser call to upload files avatar and coverimage before
router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }

]), registerUser)

router.route("/login").post(loginUser);

// secured routes 

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
// export default router;

export default router;