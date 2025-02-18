import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";

const { Schema } = mongoose;

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
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
