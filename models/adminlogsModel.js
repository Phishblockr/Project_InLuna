import mongoose from "mongoose";

const adminLogsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        operationsPerformed: {
            type: String,
            required: [true, "Operations Performed cannot be null"]
        },
        orgId: {
            type: String,
            required: [true, "Organization ID cannot be empty"],
        },
    },
    { timestamps: true }
);
adminLogsSchema.index({ orgId: 1, createdAt: 1 });
const AdminLogs = mongoose.model("AdminLogs", adminLogsSchema);

export default AdminLogs;

