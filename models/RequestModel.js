import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema(
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
            type: String,
            required: [true, "Organization ID cannot be empty"],
        },
        reqOption:{
            type : String,
            enum: ['whitelist', 'blacklist'],
            required:true,
        }
    },
    { timestamps: true }
);

RequestSchema.index({ orgId: 1, createdAt: 1 });

const Request = mongoose.model("Request", RequestSchema);

export default Request;
