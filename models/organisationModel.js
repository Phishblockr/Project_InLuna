import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";
import { getDb } from "../admindb.js";

const { Schema } = mongoose;

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    adminEmailIds: [{
        type: String,
        match: [/.+@.+\..+/, 'Please fill a valid email address'],
        require: true
    }],
    adminIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    adminName: {
        type: String,
        required: true,
        trim: true,
        default: ""
    },
    totalUsers: {
        type: Number,
        required: true,
        default: 0
    },
    usersCount: {
        type: Number,
        default: 0
    },
    orgId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    subscription: {
        type: String,
        default: "freemium"
    },
    // Price per member (stored in paise to avoid floating point errors)
    perMemberPriceInPaise: {
        type: Number,
        default: null // e.g. 10000 = INR 100.00 per member
    },
});

export default organizationSchema;

export const getOrgModel = async () => {
    const adminDb = await getDb();
    return (adminDb.models.Organization || adminDb.model("Organization", organizationSchema));
}
