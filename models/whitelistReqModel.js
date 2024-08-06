const mongoose = require("mongoose");

const whitelistReqSchema = new mongoose.Schema(
    {
        userProfileImg:{
            type:String,
            default: ""
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "UserId cannot be empty"],
        },
        username:{
            type:String,
            required:[true, "username cannot be empty"],
            trim: true
        },
        url:{
            type: String,
            required:[true, "Url cannot be empty"],
        },
        reason: {
            type: String,
            default: "Please whitelist the Url.",
            maxlength: 500
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        orgId:{
            type: Number,
            required: [true, "Organization ID cannot be empty"],
        },
    },
    { timestamps: true }
);
whitelistReqSchema.index({orgId: 1});
const whitelistReq = new mongoose.model("whitelistReq", whitelistReqSchema);
module.exports = whitelistReq;