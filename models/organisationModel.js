import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";

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
        trim: true
    },
    totalUsers: {
        type: Number,
        required: true
    },
    orgId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default organizationSchema;

export const getOrgModel = async (tenantId) => {
    const tenantDb = await getTenantDB(tenantId);
    return tenantDb.models.Organization || tenantDb.model("Organization", organizationSchema);
}
