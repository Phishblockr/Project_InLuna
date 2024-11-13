import mongoose from "mongoose";

const adminLogsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        operationType: {
            type: String,
            enum: ['update', 'delete', 'add', "approved", "account recovery"],
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
adminLogsSchema.index({ orgId: 1, createdAt: 1 });
const AdminLogs = mongoose.model("AdminLogs", adminLogsSchema);

export default AdminLogs;

