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
        console.log(user)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


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
                "User logged in asuccessfully"
            )
        )


})

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
        status(200).
        clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )

        )
})





export {
    registerUser,
    loginUser,
    logoutUser
}