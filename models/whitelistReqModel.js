import mongoose from 'mongoose';

const whitelistReqSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "UserId cannot be empty"],
        },
        url: {
            type: String,
            required: [true, "Url cannot be empty"],
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
        orgId: {
            type: Number,
            required: [true, "Organization ID cannot be empty"],
        },
    },
    { timestamps: true }
);

whitelistReqSchema.index({ orgId: 1, createdAt: 1 });

const WhitelistReq = mongoose.model("whitelistReq", whitelistReqSchema);

export default WhitelistReq;
