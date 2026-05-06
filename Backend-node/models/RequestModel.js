import mongoose from 'mongoose';
import { getTenantDB } from '../tenantdb.js';

const RequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // ✅ Ensure "User" is the correct model name
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
        reqOption: {
            type: String,
            enum: ['whitelist', 'blacklist'],
            required: true,
        },
        reputationDetails: {
            type: Object,
            default: null,
        }, // Store VirusTotal analysis stats
        reputationScore: {
            type: Number,
            default: 0,
        }, // Store VirusTotal reputation score
    },
    { timestamps: true }
);

RequestSchema.index({ orgId: 1, createdAt: 1 });

export default RequestSchema;

export const getRequestModel = async (tenantId) => {
    const tenantDb = await getTenantDB(tenantId);
    return tenantDb.models.Request || tenantDb.model("Request", RequestSchema);
}