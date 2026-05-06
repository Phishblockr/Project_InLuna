import mongoose from "mongoose";
import { getTenantDB } from "../tenantdb.js";

const urlSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Url cannot be empty"],
    },
    visitedBy: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          visits: [
            {
              timestamp: {
                type: Date,
                default: Date.now,
              },
            },
          ],
          totalVisits: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    category: {
      type: [String],
      default: ["general"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPhishing: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["whitelisted", "blacklisted"],
      default: "whitelisted",
    },
    isUserAdded: {
      type: Boolean,
      default: false,
    },
    orgId: {
      type: String,
    },
    reputationDetails: {
      type: Object,
      default: null,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    RequestIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request",
      },
    ],
  },
  { timestamps: true }
);

urlSchema.index({ userId: 1, });

export default urlSchema;

export const getUrlModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return tenantDb.models.Url || tenantDb.model("Url", urlSchema);
}
