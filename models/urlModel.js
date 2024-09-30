import mongoose from 'mongoose';

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
            ref: "user",
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
    category: [{
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
    status: {
      type: String,
      enum: ['whitelisted', 'blacklisted'],
      default: 'whitelisted'
    },
    isUserAdded: {
      type: Boolean,
      default: false,
    },
    orgId: {
      type: String,
      required: [true, "Organization ID cannot be empty"],
    },
    whitelistReqIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WhitelistReq',
      }
    ]
  },
  { timestamps: true }
);

urlSchema.index({ url: 1, orgId: 1, createdAt: 1 });

const Url = mongoose.model("Url", urlSchema);

export default Url;
