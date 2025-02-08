import mongoose, { Schema } from "mongoose";


const subscriptionSchema = new Schema({
    // one who is subscribing
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    // channel (it is user as well) to which subscriber is subscribing
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}
    , { timestamps: true }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)