import asyncHandler from "../../middlewares/asyncHandler.js";
import { getGamificationEventModel } from "../../models/trainingPlatform/gamificationEventModel.js";
import { getUserModel } from "../../models/userModel.js";

export const logGamificationEvent = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.userId || !req.user.orgId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { orgId, userId } = req.user;

  const {
    department,
    category,
    refId,
    label,
    score,
    maxScore,
    completed,
    meta,
  } = req.body || {};

  if (!department || !category || typeof score !== "number") {
    return res.status(400).json({
      success: false,
      message: "department, category and numeric score are required",
    });
  }

  const GamificationEvent = await getGamificationEventModel(orgId);

  // ---------- CTF: one document per user+scenario ----------
  if (category === "ctf" && refId) {
    const filter = { userId, category: "ctf", refId };

    let doc = await GamificationEvent.findOne(filter);

    if (!doc) {
      // First time this user plays this scenario
      doc = new GamificationEvent({
        userId,
        department,
        category: "ctf",
        refId,
        label,
        score,
        maxScore: typeof maxScore === "number" ? maxScore : undefined,
        completed: !!completed,
        meta: {
          ...(meta || {}),
          attempts: 1,
          lastScore: score,
        },
      });

      await doc.save();
      return res.status(201).json({
        success: true,
        eventId: doc._id,
        created: true,
        updated: false,
      });
    }

    // There is already a record for this scenario + user
    const prevAttempts = doc.meta?.attempts || 1;
    const prevScore = typeof doc.score === "number" ? doc.score : 0;

    // If scenario already completed before → do NOT increase leaderboard score
    if (doc.completed) {
      doc.meta = {
        ...(doc.meta || {}),
        attempts: prevAttempts + 1,
        lastScore: score, // last attempt score, but not used in aggregation
      };
      await doc.save();

      return res.status(200).json({
        success: true,
        eventId: doc._id,
        created: false,
        updated: true,
        note: "Scenario already completed earlier, score not increased",
      });
    }

    // Scenario not completed yet → we can improve best score, and if this run succeeded, mark completed
    const newBestScore = Math.max(prevScore, score);

    doc.score = newBestScore;
    if (typeof maxScore === "number") {
      doc.maxScore = maxScore;
    }
    doc.completed = doc.completed || !!completed;
    doc.meta = {
      ...(doc.meta || {}),
      ...(meta || {}),
      attempts: prevAttempts + 1,
      lastScore: score,
    };

    await doc.save();

    return res.status(200).json({
      success: true,
      eventId: doc._id,
      created: false,
      updated: true,
    });
  }

  // ---------- Default behavior for quiz / mission / tournament ----------
  const event = new GamificationEvent({
    userId,
    department,
    category,
    refId,
    label,
    score,
    maxScore: typeof maxScore === "number" ? maxScore : undefined,
    completed: completed !== undefined ? !!completed : true,
    meta: meta || {},
  });

  await event.save();

  return res.status(201).json({ success: true, eventId: event._id });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { department, timeRange = "all-time" } = req.query;
  const { orgId } = req.user || req.user.orgId;

  if (!orgId) {
    return res
      .status(400)
      .json({ success: false, message: "orgId missing in auth context" });
  }

  const GamificationEvent = await getGamificationEventModel(orgId);
  const User = await getUserModel(orgId);

  const match = {};

  // Optional department filter (stored on the event – usually a slug/string)
  if (department && department !== "all") {
    match.department = department;
  }

  // Time filters
  if (timeRange === "weekly" || timeRange === "monthly") {
    const now = new Date();
    const start = new Date(now);
    if (timeRange === "weekly") start.setDate(now.getDate() - 7);
    if (timeRange === "monthly") start.setMonth(now.getMonth() - 1);
    match.createdAt = { $gte: start };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: "$userId",
        totalScore: { $sum: "$score" },
        completedCount: {
          $sum: {
            $cond: [{ $eq: ["$completed", true] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: {
        totalScore: -1,
      },
    },
    { $limit: 100 },
    {
      $lookup: {
        from: User.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
  ];

  const agg = await GamificationEvent.aggregate(pipeline);

  const leaderboard = agg.map((row, index) => ({
    userId: row._id,
    name: row.user.name || row.user.email || "Unknown",
    department: row.user.department || "Unknown",
    score: row.totalScore,
    completed: row.completedCount,
    rank: index + 1,
  }));

  return res.status(200).json({ success: true, data: leaderboard });
});

export const getCtfStatus = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.userId || !req.user.orgId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { orgId, userId } = req.user;

  if (!orgId) {
    return res.status(400).json({
      success: false,
      message: "orgId missing in auth context",
    });
  }

  const queryUserId = userId;

  if (!queryUserId) {
    return res.status(400).json({
      success: false,
      message: "userId is required",
    });
  }

  const GamificationEvent = await getGamificationEventModel(orgId);

  const docs = await GamificationEvent.find({
    userId: queryUserId,
    category: "ctf",
  })
    .select("refId label completed score maxScore meta")
    .lean();

  const result = docs.map((d) => ({
    refId: d.refId,
    label: d.label || "",
    completed: !!d.completed,
    score: d.score || 0,
    maxScore: d.maxScore || 0,
    attempts: d.meta?.attempts || 1,
    lastScore: d.meta?.lastScore || 0,
  }));

  return res.status(200).json({ success: true, data: result });
});

export const getMissionStatus = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user || {};

  if (!orgId || !userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const GamificationEvent = await getGamificationEventModel(orgId);

  const docs = await GamificationEvent.find({
    userId,
    category: "mission",
  })
    .select("refId label completed score maxScore meta")
    .lean();

  const result = docs.map((d) => ({
    refId: d.refId,
    label: d.label || "",
    completed: !!d.completed,
    score: d.score || 0,
    maxScore: d.maxScore || 0,
    attempts: d.meta?.attempts || 1,
    lastScore: d.meta?.lastScore || d.score || 0,
  }));

  return res.status(200).json({ success: true, data: result });
});
