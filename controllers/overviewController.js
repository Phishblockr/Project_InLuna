import UrlSchema from "../models/urlModel.js";
import WhitelistReqSchema from "../models/RequestModel.js";
import UserSchema from "../models/userModel.js";
import HeartBeatSchema from "../models/heartBeatModel.js";
import asyncHandler from '../middlewares/asyncHandler.js';
import mongoose from 'mongoose';
import UrlhausDataSchema from "../models/urlhausModel.js";
import { getTenantDB } from "../tenantdb.js"

const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    let percentage = ((current - previous) / previous) * 100;
    percentage = Math.trunc(percentage);
    return Math.min(percentage, 100);
};

export const fetchOrgMetrics = asyncHandler(async (req, res) => {
    try {
        const { month, year, timeFrame, browsingProfileMetrics } = req.query;
        const BPMetrics = parseInt(browsingProfileMetrics);
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // ✅ Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Register models dynamically in tenant DB
        if (!tenantDb.models.WhitelistReq) tenantDb.model("WhitelistReq", WhitelistReqSchema);
        if (!tenantDb.models.Url) tenantDb.model("Url", UrlSchema);
        if (!tenantDb.models.User) tenantDb.model("User", UserSchema);
        if (!tenantDb.models.HeartBeat) tenantDb.model("HeartBeat", HeartBeatSchema);

        // ✅ Get tenant models
        const WhitelistReq = tenantDb.models.WhitelistReq;
        const Url = tenantDb.models.Url;
        const User = tenantDb.models.User;
        const HeartBeat = tenantDb.models.HeartBeat;

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        const previousYear = month == 1 ? year - 1 : year;
        const previousMonth = month == 1 ? 12 : month - 1;
        const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

        // ✅ Fetch whitelist approvals
        const approvedWhitelistCount = await WhitelistReq.countDocuments({ orgId, status: "approved", createdAt: { $gte: startOfMonth, $lt: endOfMonth } });
        const previousApprovedWhitelistCount = await WhitelistReq.countDocuments({ orgId, status: "approved", createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } });

        // ✅ Fetch blacklisted URL counts
        const blacklistedUrlsCount = await Url.countDocuments({ orgId, status: "blacklisted", createdAt: { $gte: startOfMonth, $lt: endOfMonth } });
        const previousBlacklistedUrlsCount = await Url.countDocuments({ orgId, status: "blacklisted", createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } });

        // ✅ Aggregate total visits, blacklisted visits, phishing visits
        const orgMetrics = await Url.aggregate([
            { $match: { orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: null,
                    totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
                    totalOrgBlacklistedVisits: { $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] } },
                    totalOrgPhishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } }
                }
            }
        ]);

        // ✅ Fetch previous month metrics
        const previousOrgMetrics = await Url.aggregate([
            { $match: { orgId, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: null,
                    totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
                    totalOrgBlacklistedVisits: { $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] } },
                    totalOrgPhishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } }
                }
            }
        ]);

        // ✅ Bar Graph Data
        const timeGroup = { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } };
        const visitsByTimeFrame = await Url.aggregate([
            { $match: { orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: timeGroup,
                    totalVisits: { $sum: "$visitedBy.totalVisits" },
                    blacklistedVisits: { $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] } },
                    phishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // ✅ Scatter Plot Data (Department Level)
        const departments = await User.distinct("department", { orgId });
        const visitDataByDep = await Url.aggregate([
            { $match: { orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $lookup: { from: "users", localField: "visitedBy.userId", foreignField: "_id", as: "userDetails" } },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$userDetails.department",
                    phishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } },
                    blacklistedVisits: { $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] } },
                    totalVisits: { $sum: "$visitedBy.totalVisits" }
                }
            }
        ]);
        const scatterPlotData = departments.map(department => {
            const data = visitDataByDep.find(d => d._id === department);
            return data || { department, phishingVisits: 0, blacklistedVisits: 0, totalVisits: 0 };
        });

        // ✅ Heatmap Data
        const heatmapResults = await Url.aggregate([
            { $match: { orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $unwind: "$category" },
            {
                $group: {
                    _id: { category: "$category", time: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
                    totalVisits: { $sum: "$visitedBy.totalVisits" }
                }
            },
            { $sort: { "_id.time": 1 } }
        ]);

        const heatmapData = heatmapResults.reduce((acc, item) => {
            const { category, time } = item._id;

            if (!acc[category]) {
                acc[category] = { times: [], visits: [] };
            }

            acc[category].times.push(time);
            acc[category].visits.push(item.totalVisits);

            return acc;
        }, {});

        // ✅ Fetch Users for Browsing Profile Classification
        const users = await User.find({ orgId });

        const goodBrowsingProfile = [];
        const badBrowsingProfile = [];

        for (const user of users) {
            const userId = user._id;

            const userMetrics = await Url.aggregate([
                { $match: { "visitedBy.userId": userId, orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
                { $unwind: "$visitedBy" },
                { $match: { "visitedBy.userId": userId } },
                {
                    $group: {
                        _id: null,
                        totalVisits: { $sum: "$visitedBy.totalVisits" },
                        phishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } },
                        blacklistedVisits: { $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] } }
                    }
                }
            ]);

            if (userMetrics.length === 0) {
                goodBrowsingProfile.push({
                    userId, profilePic: user.img, name: user.name, department: user.department
                });
                continue;
            }

            const { totalVisits, phishingVisits, blacklistedVisits } = userMetrics[0];
            const phishingRate = (phishingVisits / totalVisits) * 100;
            const blacklistedRate = (blacklistedVisits / totalVisits) * 100;

            if (phishingRate > BPMetrics || blacklistedRate > BPMetrics) {
                badBrowsingProfile.push({
                    userId, profilePic: user.img, name: user.name, department: user.department, phishingRate, blacklistedRate
                });
            } else {
                goodBrowsingProfile.push({
                    userId, profilePic: user.img, name: user.name, department: user.department, phishingRate, blacklistedRate
                });
            }
        }

        let response = {
            totalApprovedWhitelistRequests: approvedWhitelistCount,
            totalBlacklistedUrls: blacklistedUrlsCount,
            totalOrgVisits: orgMetrics[0]?.totalOrgVisits || 0,
            totalOrgBlacklistedVisits: orgMetrics[0]?.totalOrgBlacklistedVisits || 0,
            totalOrgPhishingVisits: orgMetrics[0]?.totalOrgPhishingVisits || 0,
            percentageChangeOrgVisits: calculatePercentage(orgMetrics[0]?.totalOrgVisits || 0, previousOrgMetrics[0]?.totalOrgVisits || 0),
            percentageChangeOrgBlacklistedVisits: calculatePercentage(orgMetrics[0]?.totalOrgBlacklistedVisits || 0, previousOrgMetrics[0]?.totalOrgBlacklistedVisits || 0),
            percentageChangeOrgPhishingVisits: calculatePercentage(orgMetrics[0]?.totalOrgPhishingVisits || 0, previousOrgMetrics[0]?.totalOrgPhishingVisits || 0),
            percentageChangeApprovedWhitelistRequests: calculatePercentage(approvedWhitelistCount, previousApprovedWhitelistCount),
            percentageChangeBlacklistedUrls: calculatePercentage(blacklistedUrlsCount, previousBlacklistedUrlsCount),
            barGraphData: {
                labels: visitsByTimeFrame.map(item => item._id),
                totalVisits: visitsByTimeFrame.map(item => item.totalVisits),
                blacklistedVisits: visitsByTimeFrame.map(item => item.blacklistedVisits),
                phishingVisits: visitsByTimeFrame.map(item => item.phishingVisits)
            },
            scatterPlotData,
            heatmapData,
            goodBrowsingProfile,
            badBrowsingProfile
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("❌ Error fetching org metrics:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



export const fetchUserMetrics = asyncHandler(async (req, res) => {
    try {
        const { id, month, year } = req.params; // User ID from Dashboard View
        const userObjectId = new mongoose.Types.ObjectId(id);

        // ✅ Get `orgId` from user authentication data
        const orgId = req.user.orgId;
        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        // ✅ Get tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to connect to tenant database." });
        }

        // ✅ Load models dynamically for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const WhitelistReq = tenantDb.models.WhitelistReq || tenantDb.model("WhitelistReq", WhitelistReqSchema);
        const UrlhausData = tenantDb.models.UrlhausData || tenantDb.model("UrlhausData", UrlhausDataSchema);

        // ✅ Set Date Ranges
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        const previousMonth = month == 1 ? 12 : month - 1;
        const previousYear = month == 1 ? year - 1 : year;
        const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

        // ✅ Fetch Phishing Clicks Count
        const phishingClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, isPhishing: true, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } }
        ]);

        // ✅ Fetch Malware Hosted Visits
        const malwareHostedVisits = await UrlhausData.aggregate([
            { $match: { "visitedBy.userId": userObjectId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } }
        ]);

        // ✅ Fetch Whitelist Requests Count
        const whitelistReqsCount = await WhitelistReq.countDocuments({
            userId: userObjectId,
            status: { $in: ["pending", "approved"] },
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        // ✅ Fetch Visits to Whitelist URLs
        const approvedWhitelistReq = await WhitelistReq.find({
            userId: userObjectId,
            status: { $in: ["approved", "pending"] },
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }).select("_id");

        const whitelistReqsIds = approvedWhitelistReq.map(req => req._id);
        const visitsToWhitelistUrls = await Url.aggregate([
            { $match: { whitelistReqIds: { $in: whitelistReqsIds }, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } }
        ]);

        // ✅ Fetch Previous Month's Data for Comparison
        const previousPhishingClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, isPhishing: true, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } }
        ]);

        const previousMalwareHostedVisits = await UrlhausData.aggregate([
            { $match: { "visitedBy.userId": userObjectId, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } }
        ]);

        const previousWhitelistReqsCount = await WhitelistReq.countDocuments({
            userId: userObjectId,
            status: { $in: ["pending", "approved"] },
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        });

        // ✅ Prepare Bar Graph Data (Grouped by Day)
        const visitsByDay = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                    totalVisits: { $sum: "$visitedBy.totalVisits" },
                    phishingVisits: { $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // ✅ Merge Malware Hosted Data into Bar Graph
        const malwareHostedVisitsByDay = await UrlhausData.aggregate([
            { $match: { "visitedBy.userId": userObjectId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                    malwareHostedVisits: { $sum: "$visitedBy.totalVisits" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const malwareMap = new Map(malwareHostedVisitsByDay.map(item => [item._id, item.malwareHostedVisits]));
        visitsByDay.forEach(item => {
            item.malwareHostedVisits = malwareMap.get(item._id) || 0;
        });

        // ✅ Format Response
        res.json({
            phishingClicks: phishingClicksCount[0]?.total || 0,
            malwareHostedVisits: malwareHostedVisits[0]?.total || 0,
            whitelistRequests: whitelistReqsCount,
            visitsToWhitelistUrls: visitsToWhitelistUrls[0]?.total || 0,
            barGraphData: {
                labels: visitsByDay.map(item => item._id),
                totalVisits: visitsByDay.map(item => item.totalVisits),
                malwareHostedVisits: visitsByDay.map(item => item.malwareHostedVisits),
                phishingVisits: visitsByDay.map(item => item.phishingVisits)
            }
        });

    } catch (error) {
        console.error("❌ Error fetching user metrics:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


