import mongoose from "mongoose";
import { getTenantDB } from "../../tenantdb.js";

const userCourseSchema = new mongoose.Schema({
  orgId: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  assignedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["assigned", "completed", "inprogress"],
    default: "assigned",
  },
  watchStatus: [
    {
      videoId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      watchedDuration: {
        type: Number,
        default: 0,
      },
      lastWatchedAt: {
        type: Date,
        default: Date.now,
      },
      // when the user first started playing this video
      firstPlayedAt: {
        type: Date,
      },
      // whether client/server considers this video completed
      completed: {
        type: Boolean,
        default: false,
      },
      // when the video was marked completed
      completedAt: {
        type: Date,
      },
      // skip detection flag (for server-side analytics) + timestamp
      suspectedSkip: {
        type: Boolean,
        default: false,
      },
      suspectedSkipAt: {
        type: Date,
      },
      watchHistory: [
        {
          watchedDuration: {
            type: Number,
            required: true,
          },
          watchedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  ],
  progress: {
    type: Number,
    default: 0,
  },
});

export const getUserCourseModel = async (tenantId) => {
  const tenantDb = await getTenantDB(tenantId);
  return (
    tenantDb.models.UserCourse || tenantDb.model("UserCourse", userCourseSchema)
  );
};
