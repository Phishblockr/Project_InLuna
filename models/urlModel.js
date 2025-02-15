import mongoose from "mongoose";

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
            ref: "User", // ✅ Correct reference to User model
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
      required: [true, "Organization ID cannot be empty"],
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

// ✅ Indexing for faster queries
urlSchema.index({ url: 1, orgId: 1, createdAt: 1 });

// ✅ Export only the schema (not the model)
export default urlSchema;
