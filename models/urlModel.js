import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Url cannot be empty"],
    },
    visitedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          required: [true, "UserId cannot be empty"],
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
          default: 1,
        },
      },
    ],
    tags: [{
        type: String,
        default: "general",
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPhishing: {
      type: Boolean,
      default: true,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    isUserAdded: {
      type: Boolean,
      default: false,
    },
    orgId: {
      type: Number,
      required: [true, "Organization ID cannot be empty"],
    },
  },
  { timestamps: true }
);

urlSchema.index({ url: 1, orgId: 1, createdAt: 1});

const Url = mongoose.model("Url", urlSchema);

export default Url;
