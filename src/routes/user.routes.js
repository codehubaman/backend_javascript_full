import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middlewares/mutler.middleware.js";
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
// export default router;

export default router;