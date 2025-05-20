import UrlSchema, { getUrlModel } from "../models/urlModel.js";
import WhitelistReqSchema, { getRequestModel } from "../models/RequestModel.js";
import UserSchema, { getUserModel } from "../models/userModel.js";
import HeartBeatSchema, {
  getHeartBeatModel,
} from "../models/heartBeatModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import UrlhausDataSchema, { getUrlhausModel } from "../models/urlhausModel.js";
import { getTenantDB } from "../tenantdb.js";

const calculatePercentage = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  let percentage = ((current - previous) / previous) * 100;
  percentage = Math.trunc(percentage);
  return Math.min(percentage, 100);
};

export const fetchOrgMetrics = async (req, res) => {
  const { month, year, timeFrame, browsingProfileMetrics } = req.query;
  const BPMetrics = parseInt(browsingProfileMetrics);
  const orgId = req.user.orgId;

  try {
    // Get tenant-specific models based on orgId
    const WhitelistReq = await getRequestModel(orgId);
    const Url = await getUrlModel(orgId);
    const User = await getUserModel(orgId);
    const HeartBeat = await getHeartBeatModel(orgId);

    // Calculate date ranges
    let startDate, endDate;

    // Always end at today
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (timeFrame === "weekly") {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 6); // last 7 days (including today)
      startDate.setHours(0, 0, 0, 0);
    } else if (timeFrame === "fortnightly") {
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 13); // last 14 days
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Default to full month
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const previousYear = month == 1 ? year - 1 : year;
    const previousMonth = month == 1 ? 12 : month - 1;
    const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
    const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

    // Approved whitelist count for current and previous month
    const approvedWhitelistCount = await WhitelistReq.countDocuments({
      orgId: orgId,
      status: "approved",
      createdAt: { $gte: startDate, $lt: endDate },
    });
    const previousApprovedWhitelistCount = await WhitelistReq.countDocuments({
      orgId: orgId,
      status: "approved",
      createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });

    // Blacklisted URLs count for current and previous month
    const blacklistedUrlsCount = await Url.countDocuments({
      orgId: orgId,
      status: "blacklisted",
      createdAt: { $gte: startDate, $lt: endDate },
    });
    const previousBlacklistedUrlsCount = await Url.countDocuments({
      orgId: orgId,
      status: "blacklisted",
      createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });

    // Org metrics aggregation for current month
    const orgMetrics = await Url.aggregate([
      {
        $match: {
          orgId: orgId,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $group: {
          _id: null,
          totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
          totalOrgBlacklistedVisits: {
            $sum: {
              $cond: [
                { $eq: ["$status", "blacklisted"] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          totalOrgPhishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
        },
      },
    ]);

    // Org metrics aggregation for previous month
    const previousOrgMetrics = await Url.aggregate([
      {
        $match: {
          orgId: orgId,
          createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $group: {
          _id: null,
          totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
          totalOrgBlacklistedVisits: {
            $sum: {
              $cond: [
                { $eq: ["$status", "blacklisted"] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          totalOrgPhishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
        },
      },
    ]);

    // Define the time grouping based on the timeFrame parameter
    let timeGroup;
    if (timeFrame === "daily") {
      timeGroup = { $hour: "$createdAt" };
    } else {
      // For weekly, fortnightly, monthly — use daily grouping
      timeGroup = { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } };
    }

    // Aggregate visits by time frame
    const visitsByTimeFrame = await Url.aggregate([
      {
        $match: {
          orgId: orgId,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $group: {
          _id: timeGroup,
          totalVisits: { $sum: "$visitedBy.totalVisits" },
          blacklistedVisits: {
            $sum: {
              $cond: [
                { $eq: ["$status", "blacklisted"] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          phishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // For department level scatter plot
    const departments = await User.distinct("department", { orgId: orgId });
    const visitDataByDep = await Url.aggregate([
      {
        $match: {
          orgId: orgId,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $lookup: {
          from: "users",
          localField: "visitedBy.userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $group: {
          _id: "$userDetails.department",
          phishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          blacklistedVisits: {
            $sum: {
              $cond: [
                { $eq: ["$status", "blacklisted"] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          totalVisits: { $sum: "$visitedBy.totalVisits" },
        },
      },
      {
        $project: {
          department: "$_id",
          phishingVisits: 1,
          blacklistedVisits: 1,
          totalVisits: 1,
          _id: 0,
        },
      },
    ]);

    const scatterPlotData = departments.map((department) => {
      const departmentData = visitDataByDep.find(
        (d) => d.department === department
      );
      return (
        departmentData || {
          department,
          phishingVisits: 0,
          blacklistedVisits: 0,
          totalVisits: 0,
        }
      );
    });

    // Heat map graph data aggregation
    const categoryHeatmapData = await Url.aggregate([
      {
        $match: {
          orgId: orgId,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      { $unwind: "$visitedBy" },
      { $unwind: "$category" },
      {
        $group: {
          _id: {
            time: timeGroup,
            category: "$category",
          },
          totalVisits: { $sum: "$visitedBy.totalVisits" },
          blacklistedVisits: {
            $sum: {
              $cond: [
                { $eq: ["$status", "blacklisted"] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
          phishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.time": 1 } },
    ]);

    const heatmapData = categoryHeatmapData.reduce((acc, item) => {
      const { time, category } = item._id;
      if (!acc[category]) {
        acc[category] = {
          times: [],
          visits: [],
          blacklisted: [],
          phishing: [],
        };
      }
      acc[category].times.push(time);
      acc[category].visits.push(item.totalVisits);
      acc[category].blacklisted.push(item.blacklistedVisits);
      acc[category].phishing.push(item.phishingVisits);
      return acc;
    }, {});

    // Browsing Profile Classification
    const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days
    const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD);
    const users = await User.find({ orgId: orgId });
    const goodBrowsingProfile = [];
    const badBrowsingProfile = [];

    for (const user of users) {
      const userId = user._id;
      const classifyUsersByBrowsingProfile = await Url.aggregate([
        {
          $match: {
            "visitedBy.userId": userId,
            orgId: orgId,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        { $unwind: "$visitedBy" },
        { $match: { "visitedBy.userId": userId } },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: "$visitedBy.totalVisits" },
            phishingVisits: {
              $sum: {
                $cond: [
                  { $eq: ["$isPhishing", true] },
                  "$visitedBy.totalVisits",
                  0,
                ],
              },
            },
            blacklistedVisits: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "blacklisted"] },
                  "$visitedBy.totalVisits",
                  0,
                ],
              },
            },
          },
        },
      ]);
      // Default to good profile if no data found
      if (classifyUsersByBrowsingProfile.length === 0) {
        goodBrowsingProfile.push({
          userId,
          profilePic: user.img,
          name: user.name,
          department: user.department,
          heartBeatStatus: "not initialized",
        });
        continue;
      }
      const { totalVisits, phishingVisits, blacklistedVisits } =
        classifyUsersByBrowsingProfile[0];
      const phishingRate = (phishingVisits / totalVisits) * 100;
      const blacklistedRate = (blacklistedVisits / totalVisits) * 100;
      if (phishingRate > BPMetrics || blacklistedRate > BPMetrics) {
        badBrowsingProfile.push({
          userId,
          profilePic: user.img,
          name: user.name,
          department: user.department,
          phishingRate,
          blacklistedRate,
          heartBeatStatus: "not initialized",
        });
      } else {
        goodBrowsingProfile.push({
          userId,
          profilePic: user.img,
          name: user.name,
          department: user.department,
          phishingRate,
          blacklistedRate,
          heartBeatStatus: "not initialized",
        });
      }
    }

    // Heartbeat processing
    const heartBeats = await HeartBeat.find({ orgId: orgId });
    const updateProfileWithHeartbeat = (profile) => {
      const heartBeat = heartBeats.find(
        (hb) => hb.userId.toString() === profile.userId.toString()
      );
      if (heartBeat) {
        const isInactive = heartBeat.timestamp < cutoffDate;
        const hasDownTimeToday = heartBeat.downtime.some((dt) => {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          return (
            dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday
          );
        });
        if (hasDownTimeToday) {
          profile.heartBeatStatus = "downtime detected";
        } else if (isInactive) {
          profile.heartBeatStatus = "inactive";
        } else {
          profile.heartBeatStatus = "active";
        }
      }
    };

    goodBrowsingProfile.forEach(updateProfileWithHeartbeat);
    badBrowsingProfile.forEach(updateProfileWithHeartbeat);

    const generateBarData = (startDate, endDate) => {
      const dayMap = new Map(
        visitsByTimeFrame.map((item) => [
          item._id,
          {
            totalVisits: item.totalVisits,
            blacklistedVisits: item.blacklistedVisits,
            phishingVisits: item.phishingVisits,
          },
        ])
      );

      const labels = [];
      const totalVisits = [];
      const blacklistedVisits = [];
      const phishingVisits = [];

      const current = new Date(startDate);

      while (current <= endDate) {
        const dd = String(current.getDate()).padStart(2, "0");
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const yyyy = current.getFullYear();
        const formatted = `${dd}/${mm}/${yyyy}`;

        const data = dayMap.get(formatted) || {
          totalVisits: 0,
          blacklistedVisits: 0,
          phishingVisits: 0,
        };

        labels.push(formatted);
        totalVisits.push(data.totalVisits);
        blacklistedVisits.push(data.blacklistedVisits);
        phishingVisits.push(data.phishingVisits);

        current.setDate(current.getDate() + 1);
      }

      return {
        labels,
        totalVisits,
        blacklistedVisits,
        phishingVisits,
      };
    };

    // Prepare the response object
    let response = {
      totalApprovedWhitelistRequests: approvedWhitelistCount,
      totalBlacklistedUrls: blacklistedUrlsCount,
      totalOrgVisits: orgMetrics[0]?.totalOrgVisits || 0,
      totalOrgBlacklistedVisits: orgMetrics[0]?.totalOrgBlacklistedVisits || 0,
      totalOrgPhishingVisits: orgMetrics[0]?.totalOrgPhishingVisits || 0,
      percentageChangeOrgVisits: calculatePercentage(
        orgMetrics[0]?.totalOrgVisits || 0,
        previousOrgMetrics[0]?.totalOrgVisits || 0
      ),
      percentageChangeOrgBlacklistedVisits: calculatePercentage(
        orgMetrics[0]?.totalOrgBlacklistedVisits || 0,
        previousOrgMetrics[0]?.totalOrgBlacklistedVisits || 0
      ),
      percentageChangeOrgPhishingVisits: calculatePercentage(
        orgMetrics[0]?.totalOrgPhishingVisits || 0,
        previousOrgMetrics[0]?.totalOrgPhishingVisits || 0
      ),
      percentageChangeApprovedWhitelistRequests: calculatePercentage(
        approvedWhitelistCount,
        previousApprovedWhitelistCount
      ),
      percentageChangeBlacklistedUrls: calculatePercentage(
        blacklistedUrlsCount,
        previousBlacklistedUrlsCount
      ),
      barGraphData: {
        labels: visitsByTimeFrame.map((item) => item._id),
        totalVisits: visitsByTimeFrame.map((item) => item.totalVisits),
        blacklistedVisits: visitsByTimeFrame.map(
          (item) => item.blacklistedVisits
        ),
        phishingVisits: visitsByTimeFrame.map((item) => item.phishingVisits),
      },
      rosenBarGraphData: generateBarData(startDate, endDate),
      scatterPlotData,
      heatmapData,
      goodBrowsingProfile,
      badBrowsingProfile,
    };

    res.status(200).send(response);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const fetchUserMetrics = asyncHandler(async (req, res) => {
  try {
    const { id, month, year } = req.params; // id of user to fetch metrics for
    // Convert id to ObjectId (if it's in hex string format)
    const userObjectId = mongoose.Types.ObjectId.createFromHexString(id);

    // Get the tenant (org) id from the authenticated request
    const orgId = req.user.orgId;

    // Retrieve tenant-specific models using orgId
    const Url = await getUrlModel(orgId);
    const UrlhausData = await getUrlhausModel(orgId);
    const WhitelistReq = await getRequestModel(orgId);

    // Calculate date ranges for the current and previous month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const previousMonth = month == 1 ? 12 : month - 1;
    const previousYear = month == 1 ? year - 1 : year;
    const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
    const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

    // Fetch Phishing Clicks Count for current month
    const phishingClicksCount = await Url.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          isPhishing: true,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Fetch Malware Hosted Visits from UrlhausData for current month
    const malwareHostedVisits = await UrlhausData.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Fetch Whitelist Requests Count for current month
    const whitelistReqsCount = await WhitelistReq.countDocuments({
      userId: userObjectId,
      status: { $in: ["pending", "approved"] },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    // Fetch Visits to Whitelist URLs for current month
    const approvedWhitelistReq = await WhitelistReq.find({
      userId: userObjectId,
      status: { $in: ["approved", "pending"] },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    }).select("_id");

    const whitelistReqsIds = approvedWhitelistReq.map((req) => req._id);

    const visitsToWhitelistUrls = await Url.aggregate([
      {
        $match: {
          whitelistReqIds: { $in: whitelistReqsIds },
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Previous Month's Data

    // Previous Month's Phishing Clicks Count
    const previousPhishingClicksCount = await Url.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          isPhishing: true,
          createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Previous Month's Malware Hosted Visits
    const previousMalwareHostedVisits = await UrlhausData.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Previous Month's Whitelist Requests Count
    const previousWhitelistReqsCount = await WhitelistReq.countDocuments({
      userId: userObjectId,
      status: { $in: ["pending", "approved"] },
      createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });

    // Previous Month's Visits to Whitelist URLs
    const previousApprovedWhitelistReq = await WhitelistReq.find({
      userId: userObjectId,
      status: { $in: ["pending", "approved"] },
      createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    }).select("_id");

    const previousWhitelistReqsIds = previousApprovedWhitelistReq.map(
      (req) => req._id
    );

    const previousVisitsToWhitelistUrls = await Url.aggregate([
      {
        $match: {
          whitelistReqIds: { $in: previousWhitelistReqsIds },
          createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
        },
      },
      { $unwind: "$visitedBy" },
      { $match: { "visitedBy.userId": userObjectId } },
      { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    // Bar Graph Data grouped by day (including Malware Hosted Visits)
    const visitsByDay = await Url.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $group: {
          _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
          totalVisits: { $sum: "$visitedBy.totalVisits" },
          phishingVisits: {
            $sum: {
              $cond: [
                { $eq: ["$isPhishing", true] },
                "$visitedBy.totalVisits",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Malware Hosted Visits by Day from UrlhausData
    const malwareHostedVisitsByDay = await UrlhausData.aggregate([
      {
        $match: {
          "visitedBy.userId": userObjectId,
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      { $unwind: "$visitedBy" },
      {
        $group: {
          _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
          malwareHostedVisits: { $sum: "$visitedBy.totalVisits" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge Malware Hosted Data into visitsByDay
    const malwareMap = new Map(
      malwareHostedVisitsByDay.map((item) => [
        item._id,
        item.malwareHostedVisits,
      ])
    );
    visitsByDay.forEach((item) => {
      item.malwareHostedVisits = malwareMap.get(item._id) || 0;
    });

    const barGraphData = {
      labels: visitsByDay.map((item) => item._id),
      totalVisits: visitsByDay.map((item) => item.totalVisits),
      malwareHostedVisits: visitsByDay.map((item) => item.malwareHostedVisits),
      phishingVisits: visitsByDay.map((item) => item.phishingVisits),
    };

    // Generate daily keys for the last one month
    const generateLastMonthBarData = () => {
      const selectedMonth = parseInt(month); // from req.query
      const selectedYear = parseInt(year);

      const startDate = new Date(selectedYear, selectedMonth - 1, 1); // 1st of selected month
      const endDate = new Date(selectedYear, selectedMonth, 0); // last day of selected month

      // Create a lookup map from visitsByDay
      const dayMap = new Map(
        visitsByDay.map((item) => [
          item._id, // date in "dd/MM/yyyy"
          {
            totalVisits: item.totalVisits || 0,
            malwareHostedVisits: item.malwareHostedVisits || 0,
            phishingVisits: item.phishingVisits || 0,
          },
        ])
      );

      const labels = [];
      const totalVisits = [];
      const malwareHostedVisits = [];
      const phishingVisits = [];

      const current = new Date(startDate);

      while (current <= endDate) {
        const dd = String(current.getDate()).padStart(2, "0");
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const yyyy = current.getFullYear();
        const formatted = `${dd}/${mm}/${yyyy}`;

        const data = dayMap.get(formatted) || {
          totalVisits: 0,
          malwareHostedVisits: 0,
          phishingVisits: 0,
        };

        labels.push(formatted);
        totalVisits.push(data.totalVisits);
        malwareHostedVisits.push(data.malwareHostedVisits);
        phishingVisits.push(data.phishingVisits);

        current.setDate(current.getDate() + 1);
      }

      return {
        labels,
        totalVisits,
        malwareHostedVisits,
        phishingVisits,
      };
    };

    // Prepare the final response object with calculated percentages.
    res.json({
      phishingClicks:
        phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0,
      malwareHostedVisits:
        malwareHostedVisits.length > 0 ? malwareHostedVisits[0].total : 0,
      requests: whitelistReqsCount,
      visitsToRequestedUrls:
        visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0,
      percentagePhishingClicks: calculatePercentage(
        phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0,
        previousPhishingClicksCount.length > 0
          ? previousPhishingClicksCount[0].total
          : 0
      ),
      percentageMalwareHostedVisits: calculatePercentage(
        malwareHostedVisits.length > 0 ? malwareHostedVisits[0].total : 0,
        previousMalwareHostedVisits.length > 0
          ? previousMalwareHostedVisits[0].total
          : 0
      ),
      percentageReq: calculatePercentage(
        whitelistReqsCount || 0,
        previousWhitelistReqsCount || 0
      ),
      rosenUserBarGraphData: generateLastMonthBarData(),
      percentageVisitToRequestedUrls: calculatePercentage(
        visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0,
        previousVisitsToWhitelistUrls.length > 0
          ? previousVisitsToWhitelistUrls[0].total
          : 0
      ),
      barGraphData,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
