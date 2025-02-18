import mongoose from "mongoose";

// Define the schema
const adminLogsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        operationType: {
            type: String,
            enum: ['update', 'delete', 'add', "approved", "account recovery", "password setup"],
            required: [true, "Operation type cannot be null"]
        },
        operationsPerformed: {
            type: String,
            required: [true, "Operations Performed cannot be null"]
        },
        orgId: {
            type: String,
            required: [true, "Organization ID cannot be empty"],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'entityType'
        },
        entityType: {
            type: String,
        },
        entityDetails: {
            type: Object,
            default: null
        }
    },
    { timestamps: true }
);

// Create an index for faster queries
adminLogsSchema.index({ orgId: 1, createdAt: 1 });

// ✅ Function to get AdminLogs model for a specific tenant
const getAdminLogsModel = (tenantDb) => {
    return tenantDb.models.AdminLogs || tenantDb.model("AdminLogs", adminLogsSchema);
};

export default getAdminLogsModel;
