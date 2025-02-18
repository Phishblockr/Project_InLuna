import mongoose from "mongoose";
import { getDb } from "../admindb.js";

const { Schema } = mongoose;

const superAdminSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "superadmin" },
    userType: {type: String, default: process.env.SUPERADM},
    refreshToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    setupPasswordToken: { type: String },
    setupPasswordExpires: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// ✅ Store in "superadmins" collection inside admindb
// const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema, "superadmins");

// export default SuperAdmin;

export const getSuperAdminModel = async () => {
    const adminDb = await getDb();
    return (
        adminDb.models.SuperAdmin ||
        adminDb.model("SuperAdmin", superAdminSchema)
    );
};
