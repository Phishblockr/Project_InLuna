import mongoose from "mongoose";

const { Schema } = mongoose;

const superAdminSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "superadmin" },
    createdAt: { type: Date, default: Date.now }
});

// ✅ Store in "superadmins" collection inside admindb
const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema, "superadmins");

export default SuperAdmin;
