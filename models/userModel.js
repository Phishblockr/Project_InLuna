import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";

const { Schema } = mongoose;

// Define the user schema
const userSchema = new Schema({
  img: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    unique: true,
    match: [/.+@.+\..+/, "Please fill a valid email address"],
  },
  recoveryEmail: {
    type: String,
    match: [/.+@.+\..+/, "Please fill a valid email address"],
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    default: "NA",
  },
  department: {
    type: String,
    default: "NA",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  userType: {
    type: String,
    default: () => process.env.USER,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  setupPasswordToken: {
    type: String,
  },
  setupPasswordExpires: {
    type: Date,
  },
  orgId: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  refreshTokenExt: {
    type: String,
  },
  subscription: {
    type: String,
  },
  googleId: {
    type: String,
  },
});

userSchema.index({ orgId: 1 });
export default userSchema;

export const getUserModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return tenantDb.models.User || tenantDb.model("User", userSchema);
};
