import { getUserCourseModel } from "../../models/trainingPlatform/userCourseModel.js";
import { getUserModel } from "../../models/userModel.js";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getCourseModel } from "../../admindb.js";
import { getEmailTemplateModel } from "../../models/trainingPlatform/emailTemplateModel.js";
import toUTCDateKey from "../../utils/UTCToDateKey.js";
import mongoose from "mongoose";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Small helper (server-side) to format seconds to 'Hh Mm Ss' string
function formatSecondsShort(secs) {
  const s = Math.floor(secs || 0);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

// Compute weeklySeconds and streakDays from a userCourse.watchStatus array
function computeWeeklyAndStreakFromWatchStatus(watchStatusArray, opts = {}) {
  // opts:
  // - now (Date) optional, default new Date()
  // - lookbackDays (int) optional for streak calculation, default 30
  const now = opts.now || new Date();
  const lookbackDays = opts.lookbackDays || 30;
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const lookbackAgo = new Date(now.getTime() - lookbackDays * MS_PER_DAY);

  let weeklySeconds = 0;
  const watchedDateKeys = new Set(); // for streak (YYYY-MM-DD strings)

  if (!Array.isArray(watchStatusArray))
    return { weeklySeconds: 0, streakDays: 0 };

  for (const ws of watchStatusArray) {
    if (!ws || !Array.isArray(ws.watchHistory)) continue;
    for (const ev of ws.watchHistory) {
      if (!ev) continue;
      // support both shapes: { watchedDuration, watchedAt } or { seconds, ts }
      const secs = Number(ev.watchedDuration ?? ev.seconds ?? 0);
      const ts = ev.watchedAt
        ? new Date(ev.watchedAt)
        : ev.ts
        ? new Date(ev.ts)
        : null;
      if (
        !ts ||
        Number.isNaN(ts.getTime()) ||
        !Number.isFinite(secs) ||
        secs <= 0
      )
        continue;

      // weekly total (last 7 days)
      if (ts >= sevenDaysAgo) weeklySeconds += secs;

      // for streak: consider events inside lookback window
      if (ts >= lookbackAgo && ts <= now) {
        const key = toUTCDateKey(ts); // use UTC date key; change to user-timezone if required
        watchedDateKeys.add(key);
      }
    }
  }

  // compute streak: count consecutive days backward from today (UTC)
  let streakDays = 0;
  for (let i = 0; i < lookbackDays; i++) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    day.setUTCDate(day.getUTCDate() - i);
    const key = day.toISOString().slice(0, 10);
    if (watchedDateKeys.has(key)) streakDays++;
    else break;
  }

  return { weeklySeconds, streakDays };
}

// Optional helper: compute user's weekly & streak across ALL assigned courses
// (Accepts array of userCourse documents.)
function computeUserWeeklyAndStreakAcrossCourses(userCoursesArray, opts = {}) {
  // Combine all watchStatus entries
  let combinedWatchStatus = [];
  for (const uc of userCoursesArray || []) {
    if (Array.isArray(uc.watchStatus)) {
      combinedWatchStatus = combinedWatchStatus.concat(uc.watchStatus);
    }
  }
  return computeWeeklyAndStreakFromWatchStatus(combinedWatchStatus, opts);
}

// assign course to a user
export const assignCourse = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.body;
  const adminId = req.user.userId;
  const orgId = req.user.orgId; // Tenant/organization ID

  // Retrieve the tenant-specific User model and UserCourse model
  const User = await getUserModel(orgId);
  const UserCourse = await getUserCourseModel(orgId);

  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Check if the user exists in the tenant database
  const user = await User.findOne({ _id: userId, orgId });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found in the organization" });
  }

  // Check if the course exists in the admin database
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  // Check if the course is already assigned to the user
  const existingAssignment = await UserCourse.findOne({
    orgId,
    userId,
    courseId,
  });
  if (existingAssignment) {
    return res
      .status(400)
      .json({ message: "Course already assigned to the user" });
  }

  // Create a new assignment in the tenant-specific UserCourse collection
  const newAssignment = new UserCourse({
    orgId,
    userId,
    courseId,
    assignedBy: adminId,
  });

  await newAssignment.save();

  res.status(201).json({
    message: "Course assigned successfully",
    assignment: newAssignment,
  });
});

export const getCoursesForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const orgId = req.user.orgId; // Ensure the tenant's orgId is available

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);
  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Find assignments and populate assignedBy (tenant user). We'll fetch course details
  // from the admin DB separately to avoid cross-connection populate issues.
  const assignments = await UserCourse.find({ userId }).populate(
    "assignedBy",
    "name email"
  );

  // Manually attach course details from admin DB for each assignment
  const populatedAssignments = await Promise.all(
    assignments.map(async (assignment) => {
      const a = assignment.toObject();
      const course = await Course.findById(a.courseId).select(
        "name category description"
      );
      a.courseId = course || null;
      return a;
    })
  );

  if (!populatedAssignments || populatedAssignments.length === 0) {
    return res
      .status(404)
      .json({ message: "No courses assigned to this user" });
  }

  res.status(200).json(populatedAssignments);
});

export const updateCourseProgress = asyncHandler(async (req, res) => {
  const { userId, courseId, videoId, watchedDuration } = req.body;
  const orgId = req.user.orgId; // Assuming tenant's organization ID is available here

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);

  // Retrieve the admin Course model
  const Course = await getCourseModel();

  // Find the user's course assignment
  const assignment = await UserCourse.findOne({ userId, courseId });
  if (!assignment) {
    return res.status(404).json({ message: "Course assignment not found" });
  }

  // Retrieve the total number of videos in the course from admin DB
  const courseFromAdmin = await Course.findById(assignment.courseId);
  const totalVideos = courseFromAdmin ? courseFromAdmin.videos.length : 0;

  // Find if progress for the specified video already exists
  const videoProgress = assignment.watchStatus.find(
    (status) => status.videoId.toString() === videoId
  );

  if (videoProgress) {
    // Update the watched duration for the existing video progress
    videoProgress.watchedDuration = watchedDuration;
  } else {
    // Add a new progress entry for the video
    assignment.watchStatus.push({ videoId, watchedDuration });
  }

  // Calculate the number of videos with progress entries
  const videosWatched = assignment.watchStatus.length;

  // Update overall progress as a percentage
  assignment.progress =
    totalVideos > 0 ? Math.round((videosWatched / totalVideos) * 100) : 0;

  // Save the updated assignment
  await assignment.save();

  res.status(200).json({
    message: "Progress updated successfully",
    assignment,
  });
});

export const removeCourseAssignment = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.body;
  const orgId = req.user.orgId; // Tenant's organization ID

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);

  // Find and delete the assignment
  const deletedAssignment = await UserCourse.findOneAndDelete({
    userId,
    courseId,
    orgId,
  });

  if (!deletedAssignment) {
    return res.status(404).json({ message: "Course assignment not found" });
  }

  res.status(200).json({ message: "Course assignment removed successfully" });
});

//TODO: For User side (Training Platform) Create endpoints below this line

// Fetch course details for a specific user
export const getUserAssignedCourseDetails = asyncHandler(async (req, res) => {
  const { courseId, userId } = req.params;
  const orgId = req.user.orgId; // Retrieve tenant's organization ID

  // Retrieve the tenant-specific UserCourse model
  const UserCourse = await getUserCourseModel(orgId);
  // Retrieve the common Course model from adminDB
  const Course = await getCourseModel();

  // Check if the course is assigned to the user
  const userCourse = await UserCourse.findOne({ userId, courseId });
  if (!userCourse) {
    return res
      .status(404)
      .json({ message: "Course not assigned to this user" });
  }

  // Fetch the course from admin DB
  const courseFromAdmin = await Course.findById(userCourse.courseId);
  if (!courseFromAdmin) {
    return res.status(404).json({ message: "Course not found in admin DB" });
  }

  const courseDetails = {
    courseId: courseFromAdmin._id,
    name: courseFromAdmin.name,
    description: courseFromAdmin.description,
    videos: courseFromAdmin.videos, // Assuming course has a videos field
    progress: userCourse.progress, // User-specific progress
    category: courseFromAdmin.category,
  };

  res.status(200).json(courseDetails);
});

// Update video progress
export const updateVideoProgress = asyncHandler(async (req, res) => {
  const {
    userId,
    courseId,
    videoId,
    watchedDuration = 0,
    completed = false,
  } = req.body;
  const orgId = req.user.orgId;

  const UserCourse = await getUserCourseModel(orgId);
  const userCourse = await UserCourse.findOne({ userId, courseId });
  if (!userCourse) {
    return res
      .status(404)
      .json({ success: false, message: "Course not found for the user." });
  }

  // Ensure watchedDuration is a number
  const incomingSecs = Number(watchedDuration || 0);
  const MAX_HISTORY = 200;

  // Pre-fetch admin course and build duration lookup so we can detect skips
  const Course = await getCourseModel();
  const courseFromAdmin = await Course.findById(userCourse.courseId);
  const adminVideos = (courseFromAdmin && courseFromAdmin.videos) || [];
  const totalVideos = adminVideos.length;
  const durationLookup = {};
  adminVideos.forEach((v) => {
    const vidIdStr = String(v._id || v.id || "");
    const dur = v.durationSeconds || v.duration || v.length || v.seconds || 0;
    durationLookup[vidIdStr] = Number(dur) || 0;
  });

  // Find or create watchStatus entry for this video
  const videoIndex = userCourse.watchStatus.findIndex(
    (v) => String(v.videoId) === String(videoId)
  );

  if (videoIndex >= 0) {
    const existing = userCourse.watchStatus[videoIndex];
    const prev = Number(existing.watchedDuration || 0);
    // Keep the max watchedDuration (never reduce)
    existing.watchedDuration = Math.max(prev, incomingSecs);

    // If watched duration increased, record delta in watchHistory and update lastWatchedAt
    const delta = incomingSecs - prev;
    if (delta > 0) {
      existing.lastWatchedAt = new Date();
      existing.watchHistory = existing.watchHistory || [];
      existing.watchHistory.push({
        watchedDuration: delta,
        watchedAt: new Date(),
      });

      // cap history length
      if (existing.watchHistory.length > MAX_HISTORY) {
        existing.watchHistory = existing.watchHistory.slice(-MAX_HISTORY);
      }
      // set firstPlayedAt on first non-zero play
      if (!existing.firstPlayedAt && incomingSecs > 0) {
        existing.firstPlayedAt = existing.watchHistory[0]
          ? new Date(existing.watchHistory[0].watchedAt)
          : new Date();
      }

      // Skip detection: if the incoming duration jumps to near-complete within a short time window
      try {
        const vidIdStr = String(existing.videoId || "");
        const videoDur = durationLookup[vidIdStr] || 0;
        const FULL_WATCH_RATIO = 0.9;
        const FALLBACK_SECONDS = 90;
        const completionThreshold =
          videoDur > 0
            ? Math.floor(videoDur * FULL_WATCH_RATIO)
            : FALLBACK_SECONDS;
        // threshold for quick jump: min 5s or 10% of duration
        const skipThresholdSecs = Math.min(
          5,
          Math.max(1, Math.floor(videoDur * 0.1))
        );
        const skipThresholdMs = skipThresholdSecs * 1000;

        const now = new Date();
        const firstTs = existing.firstPlayedAt
          ? new Date(existing.firstPlayedAt)
          : existing.watchHistory.length
          ? new Date(existing.watchHistory[0].watchedAt)
          : null;

        const timeSinceFirstMs = firstTs
          ? now.getTime() - firstTs.getTime()
          : Infinity;

        if (
          incomingSecs >= completionThreshold &&
          (existing.watchHistory.length <= 1 ||
            timeSinceFirstMs <= skipThresholdMs)
        ) {
          existing.suspectedSkip = true;
          existing.suspectedSkipAt = new Date();
        }
      } catch (e) {
        // Non-fatal: if skip detection fails, continue without blocking update
      }
    }

    // honor explicit completed flag from client
    if (completed) existing.completed = true;
    existing.completed = !!existing.completed;
    // set completedAt if now completed and not already set
    if (existing.completed && !existing.completedAt) {
      existing.completedAt = new Date();
    }
  } else {
    // Add new entry with initial history event if incoming seconds > 0
    const newEntry = {
      videoId,
      watchedDuration: incomingSecs,
      completed: !!completed,
      lastWatchedAt: incomingSecs > 0 ? new Date() : undefined,
      watchHistory:
        incomingSecs > 0
          ? [{ watchedDuration: incomingSecs, watchedAt: new Date() }]
          : [],
    };
    // firstPlayedAt for new entry
    if (incomingSecs > 0)
      newEntry.firstPlayedAt = newEntry.watchHistory[0].watchedAt;

    // detect skip for new entries that start already near-complete
    try {
      const vidIdStr = String(videoId || "");
      const videoDur = durationLookup[vidIdStr] || 0;
      const FULL_WATCH_RATIO = 0.9;
      const FALLBACK_SECONDS = 90;
      const completionThreshold =
        videoDur > 0
          ? Math.floor(videoDur * FULL_WATCH_RATIO)
          : FALLBACK_SECONDS;
      if (incomingSecs >= completionThreshold) {
        // No prior history: consider this a suspected skip
        newEntry.suspectedSkip = true;
        newEntry.suspectedSkipAt = new Date();
      }
    } catch (e) {}
    userCourse.watchStatus.push(newEntry);
  }

  // The rest of your existing logic to compute progress remains valid.

  const FULL_WATCH_RATIO = 0.9;
  const FALLBACK_SECONDS = 90;

  let fullyWatchedVideos = 0;
  for (const adminVideo of adminVideos) {
    const vidIdStr = String(adminVideo._id || adminVideo.id || "");
    const userEntry = userCourse.watchStatus.find(
      (x) => String(x.videoId) === vidIdStr
    );

    if (!userEntry) continue;
    if (userEntry.completed) {
      fullyWatchedVideos++;
      continue;
    }

    const videoDur = durationLookup[vidIdStr] || 0;
    if (videoDur > 0) {
      if (
        (userEntry.watchedDuration || 0) >=
        Math.floor(videoDur * FULL_WATCH_RATIO)
      ) {
        fullyWatchedVideos++;
      }
    } else {
      if ((userEntry.watchedDuration || 0) >= FALLBACK_SECONDS) {
        fullyWatchedVideos++;
      }
    }
  }

  // If admin couldn't provide videos, fallback to counting entries with completed:true or duration >= fallback
  if (totalVideos === 0) {
    fullyWatchedVideos = userCourse.watchStatus.filter(
      (v) => v.completed || (v.watchedDuration || 0) >= FALLBACK_SECONDS
    ).length;
  }

  userCourse.progress =
    totalVideos > 0 ? Math.round((fullyWatchedVideos / totalVideos) * 100) : 0;
  userCourse.status = userCourse.progress === 100 ? "completed" : "inprogress";

  await userCourse.save();

  // Optionally compute this course's weekly/streak to return in response
  const { weeklySeconds, streakDays } = computeWeeklyAndStreakFromWatchStatus(
    userCourse.watchStatus
  );

  res.json({
    success: true,
    message: "Video progress updated",
    progress: userCourse.progress,
    watchStatus: userCourse.watchStatus,
    weeklySeconds,
    streakDays,
  });
});

// Get User Course Progress
export const getUserCourseProgress = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.params;
  const orgId = req.user.orgId;

  const UserCourse = await getUserCourseModel(orgId);
  const userCourse = await UserCourse.findOne({ userId, courseId });

  if (!userCourse) {
    return res
      .status(404)
      .json({ success: false, message: "Course not found" });
  }

  // Normalize shape for client: ensure videoId is a string and include watchedDuration and completed
  const normalizedWatchStatus = (userCourse.watchStatus || []).map((w) => ({
    videoId:
      (w.videoId && w.videoId.toString && w.videoId.toString()) ||
      String(w.videoId || ""),
    watchedDuration: w.watchedDuration || 0,
    completed: !!w.completed,
  }));

  // Compute weeklySeconds and streakDays based on watchHistory
  const { weeklySeconds, streakDays } = computeWeeklyAndStreakFromWatchStatus(
    userCourse.watchStatus || []
  );

  res.status(200).json({
    success: true,
    progress: userCourse.progress,
    watchStatus: normalizedWatchStatus,
    weeklySeconds,
    streakDays,
  });
});

export const getAllAssignEmails = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const orgId = req.user.orgId; // Ensure the tenant's orgId is available

    // Retrieve the tenant-specific UserCourse model
    const UserCourse = await getUserCourseModel(orgId);
    // Retrieve the common Course model from adminDB
    const Course = await getCourseModel();
    // Retrieve the common Email Template model from the adminDB
    const EmailTemplate = await getEmailTemplateModel();

    // 1️⃣ Find all assigned courses for the user (tenant-level assignments)
    const userCourses = await UserCourse.find({ userId });

    if (!userCourses || userCourses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No courses assigned to this user" });
    }

    console.log("Backend User Courses:", userCourses);

    // 2️⃣ For each assigned course, fetch course details from admin DB and extract email groups
    let emailGroups = new Set();
    await Promise.all(
      userCourses.map(async (userCourse) => {
        const course = await Course.findById(userCourse.courseId);
        if (course && course.videos) {
          course.videos.forEach((video) => {
            if (video.assignEmail) {
              emailGroups.add(video.assignEmail); // Store unique email groups
            }
          });
        }
      })
    );

    // Convert Set to Array
    emailGroups = [...emailGroups];

    console.log("Extracted Email Groups:", emailGroups);

    if (emailGroups.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No email groups assigned to any videos in courses",
      });
    }

    // 3️⃣ Fetch email templates that match the extracted email groups
    const emailTemplates = await EmailTemplate.find({
      group: { $in: emailGroups },
    });

    console.log("Fetched Email Templates:", emailTemplates);

    res.status(200).json({
      success: true,
      assignedCourses: userCourses.length,
      emailGroups,
      emailTemplates,
    });
  } catch (error) {
    console.error("Error in getAllAssignEmails:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
});

export const getUserStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const orgId = req.user.orgId;

  // Validate userId first
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid userId" });
  }

  const mongoUserId = new mongoose.Types.ObjectId(userId);

  const UserCourse = await getUserCourseModel(orgId);

  // Boundaries
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1) Weekly seconds aggregation
  const weeklyAgg = await UserCourse.aggregate([
    { $match: { userId: mongoUserId } },
    { $unwind: "$watchStatus" },
    { $unwind: "$watchStatus.watchHistory" },
    {
      $match: { "watchStatus.watchHistory.watchedAt": { $gte: sevenDaysAgo } },
    },
    {
      $group: {
        _id: null,
        totalSeconds: { $sum: "$watchStatus.watchHistory.watchedDuration" },
      },
    },
  ]);

  const weeklySeconds = (weeklyAgg[0] && weeklyAgg[0].totalSeconds) || 0;

  // 2) Distinct watched dates (for streak) in last 30 days
  const daysAgg = await UserCourse.aggregate([
    { $match: { userId: mongoUserId } },
    { $unwind: "$watchStatus" },
    { $unwind: "$watchStatus.watchHistory" },
    {
      $match: { "watchStatus.watchHistory.watchedAt": { $gte: thirtyDaysAgo } },
    },
    {
      $project: {
        dateStr: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$watchStatus.watchHistory.watchedAt",
            timezone: "UTC",
          },
        },
      },
    },
    {
      $group: { _id: "$dateStr" },
    },
    {
      $sort: { _id: -1 },
    },
  ]);

  // Build a Set of date strings (YYYY-MM-DD UTC)
  const watchedDateSet = new Set((daysAgg || []).map((d) => d._id));

  // Compute streak: count consecutive days backward from today (UTC) while date present
  let streakDays = 0;
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayUTC);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (watchedDateSet.has(key)) streakDays++;
    else break;
  }

  res.status(200).json({
    success: true,
    weeklySeconds,
    weeklyFormatted: formatSecondsShort(weeklySeconds), // helper below
    streakDays,
  });
});
