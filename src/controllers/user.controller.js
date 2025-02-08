import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
// asyncHanlder is not required in this async function as these method is used only by internal methods 
// not performaing any web request
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        // console.log(user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// register controller
const registerUser = asyncHandler(async (req, res) => {


    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    // when data come from json   ,form then we get details in req.body
    const { fullName, email, username, password } = req.body
    //console.log("email: ", email);

    // some method check on multiple fields 
    //some take callback and each parameter is named as field
    //?  is used for if hai to  so trim karo
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

// login controller
const loginUser = asyncHandler(async (req, res) => {

    //  req body data  
    // username or email
    // find the user
    // check password
    // generate jwt access token and refresh token
    //send secure cookies 
    // return res


    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Email or username is required")
    }


    // let user;
    // if(username){
    //     user = await User.findOne({usern    ame: username.toLowerCase()})
    // }
    // else if(email){
    //     user = await User.findOne({email: email.toLowerCase()})
    // }
    const user = await User.findOne({
        $or: [{ username: username }, { email: email }]
    })

    if (!user) {
        throw new ApiError(404, "user not exist")
    }

    // jo methods like(generate access token ,isPasswordCorrect) come through  apne "user" mai hai 
    // and User is mongodb mongoose object and its methods are findOne
    // if (!password) {
    //     throw new ApiError(400, "Password is required");
    // }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "password is required")

    }


    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password  -refreshToken")

    // to send cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    // save access token and refresh token in cookies
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )


})

// logout method
const logoutUser = asyncHandler(async (req, res) => {
    // remove access and refresh token from cookies
    // return res
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {

                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )
    // to send cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )

        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token from cookies
    // as we also have refreshtoken saved in  database and we are providing it in our function to refresh access token so we are giving it name  as incoming refreshAccessToken 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, " unauthorized request")
    }
    // check if refresh token exists in db
    //  to verify that the incoming refresh token is right or not as 
    // incomingRefreshToken is encrypted and it is verified using JWT and also we have to provide refresh_token_secret

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        // database query
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, " invalid refresh token")
        }
        // check this incomingRefreshToken and user find by decoding this refreshToken 
        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }
        // to send the generated refresh token and access token to cookies 
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {

                        accessToken,
                        refreshToken: newrefreshToken
                    }, "accessToken tokens refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }

})


// 
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body

    // we get the details of user as user is already logged in and middleware is executed and it contains user information req.user = user 
    const user = await User.findById(req.user?._id)
    console.log(user)
    // purana password check karo using isPasswordCorrect Method and we define it in user
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")

    }
    user.password = newpassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
}
)


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User details"))
})

const upadateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "all fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id
        , {
            $set: {
                fullName: fullName,
                email: email
            }
        }
        , { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

// to update files

// 
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id
        , {
            $set: {
                avatar: avatar.url
            }
        }
        , { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar image updated successfully"))


})


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id
        , {
            $set: {
                coverImage: coverImage.url
            }
        }
        , { new: true }
    ).select("-password")


    return res
        .status(200)
        .json(new ApiResponse(200, user, "cover image updated successfully"))

})




export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    upadateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}  