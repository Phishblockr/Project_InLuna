import Url from "../models/urlModel.js";
import WhitelistReq from "../models/RequestModel.js";
import User from "../models/userModel.js";
import HeartBeat from "../models/heartBeatModel.js";
import asyncHandler from '../middlewares/asyncHandler.js';
import mongoose from 'mongoose';

const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const percentage = ((current - previous) / previous) * 100;
    return Math.min(percentage, 100);
};

export const fetchOrgMetrics = async (req, res) => {
    const { month, year, timeFrame, browsingProfileMetrics } = req.query;

    const BPMetrics = parseInt(browsingProfileMetrics)
    const orgId = req.user.orgId;

    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const previousMonth = month == 1 ? 12 : month - 1;
        const previousYear = month == 1 ? year - 1 : year;
        const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

        const approvedWhitelistCount = await WhitelistReq.countDocuments({
            orgId: orgId,
            status: "approved",
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const previousApprovedWhitelistCount = await WhitelistReq.countDocuments({
            orgId: orgId,
            status: "approved",
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        });

        const blacklistedUrlsCount = await Url.countDocuments({
            orgId: orgId,
            status: "blacklisted",
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const previousBlacklistedUrlsCount = await Url.countDocuments({
            orgId: orgId,
            status: "blacklisted",
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        });

        const orgMetrics = await Url.aggregate([
            {
                $match: {
                    orgId: orgId,
                    createdAt: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: null,
                    totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
                    totalOrgBlacklistedVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0]
                        }
                    },
                    totalOrgPhishingVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            }
        ]);

        const previousOrgMetrics = await Url.aggregate([
            {
                $match: {
                    orgId: orgId,
                    createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
                }
            },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: null,
                    totalOrgVisits: { $sum: "$visitedBy.totalVisits" },
                    totalOrgBlacklistedVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0]
                        }
                    },
                    totalOrgPhishingVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            }
        ]);

        // Bar Graph (group by day or hour)
        let timeGroup;
        if (timeFrame === "monthly") {
            timeGroup = { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } }; // Full date (daily)
        } else if (timeFrame === "daily") {
            timeGroup = { $hour: "$createdAt" }; // By hour (daily view)
        } else if (timeFrame === "weekly") {
            timeGroup = { $dateToString: { format: "%V/%Y", date: "$createdAt" } }; // Week number of the year
        }

        const visitsByTimeFrame = await Url.aggregate([
            {
                $match: {
                    orgId: orgId,
                    createdAt: { $gte: startOfMonth, $lt: endOfMonth }
                }
            },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: timeGroup,
                    totalVisits: { $sum: "$visitedBy.totalVisits" },
                    blacklistedVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0]
                        }
                    },
                    phishingVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // For Department Level Scatter Plot
        const departments = await User.distinct("department", { orgId: orgId });

        const visitDataByDep = await Url.aggregate([
            { $match: { orgId: orgId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $lookup: { from: "users", localField: "visitedBy.userId", foreignField: "_id", as: "userDetails" } },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$userDetails.department",
                    phishingVisits: {
                        $sum: { $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0] }
                    },
                    blacklistedVisits: {
                        $sum: { $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0] }
                    },
                    totalVisits: { $sum: "$visitedBy.totalVisits" }
                }
            },
            {
                $project: {
                    department: "$_id",
                    phishingVisits: 1,
                    blacklistedVisits: 1,
                    totalVisits: 1,
                    _id: 0
                }
            }

        ]);

        const scatterPlotData = departments.map(department => {
            const departmentData = visitDataByDep.find(d => d.department === department);
            return departmentData || { department, phishingVisits: 0, blacklistedVisits: 0, totalVisits: 0 };
        })

        // Heat map graph
        const categoryHeatmapData = await Url.aggregate([
            {
                $match: {
                    orgId: orgId,
                    createdAt: {$gte: startOfMonth, $lt: endOfMonth}
                }
            },
            {$unwind: "$visitedBy"},
            {$unwind: "$category"},
            {
                $group: {
                    _id: {
                        time: timeGroup,
                        category: "$category"
                    },
                    totalVisits: {$sum: "$visitedBy.totalVisits"},
                    blacklistedVisits: {
                        $sum: {
                            $cond:[{$eq: ["$status", "blacklisted"]}, "$visitedBy.totalVisits", 0]
                        }
                    },
                    phishingVisits: {
                        $sum: {
                            $cond: [{$eq: ["$isPhishing", true]}, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            },
            { $sort: { "_id.time": 1 } }
        ])

        const heatmapData = categoryHeatmapData.reduce((acc, item) => {
            const {time, category} = item._id;
            if (!acc[category]){
                acc[category] = {times: [], visits: [], blacklisted: [], phishing:[]};
            }
            acc[category].times.push(time);
            acc[category].visits.push(item.totalVisits);
            acc[category].blacklisted.push(item.blacklistedVisits);
            acc[category].phishing.push(item.phishingVisits);
            return acc;
        }, {})

        // Integrate Heartbeat quick status with Browsing Profile
        const INACTIVITY_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
        const cutoffDate = new Date(Date.now() - INACTIVITY_THRESHOLD); // Calculate cutoff date for inactivity

        // classify Users By Browsing Profile
        const users = await User.find({ orgId });
        const goodBrowsingProfile = [];
        const badBrowsingProfile = [];

        for (const user of users) {
            const userId = user._id;

            const classifyUsersByBrowsingProfile = await Url.aggregate([
                { $match: { "visitedBy.userId": userId, orgId, createdAt: {$gte: startOfMonth, $lt: endOfMonth} } },
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
            // If no visits, add the user to good profile by default
            if (classifyUsersByBrowsingProfile.length === 0) {
                goodBrowsingProfile.push({userId, profilePic: user.img, name: user.name, department: user.department, heartBeatStatus: "not initialized"});
                continue;
            }
            
            const { totalVisits, phishingVisits, blacklistedVisits } = classifyUsersByBrowsingProfile[0];
            const phishingRate = (phishingVisits / totalVisits) * 100;
            const blacklistedRate = (blacklistedVisits / totalVisits) * 100;

            if (phishingRate > BPMetrics || blacklistedRate > BPMetrics) {
                badBrowsingProfile.push({ userId, profilePic: user.img, name: user.name, department: user.department, phishingRate, blacklistedRate, heartBeatStatus: "not initialized" });
            } else {
                goodBrowsingProfile.push({ userId, profilePic: user.img, name: user.name, department: user.department, phishingRate, blacklistedRate, heartBeatStatus: "not initialized" });
            }
        }

        // HeartBeat code
        const heartBeats = await HeartBeat.find({orgId});

        const updateProfileWithHeartbeat = (profile) => {
            const heartBeat = heartBeats.find((hb) => hb.userId.toString() === profile.userId.toString());
            if (heartBeat){
                const isInactive = heartBeat.timestamp < cutoffDate;
                const hasDownTimeToday = heartBeat.downtime.some((dt) => {
                    const startOfToday = new Date();
                    startOfToday.setHours(0, 0, 0, 0);
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);
                    return dt.newTimestamp >= startOfToday && dt.newTimestamp <= endOfToday;
                });
                if (hasDownTimeToday) {
                    profile.heartBeatStatus = "downtime detected";
                } else if (isInactive){
                    profile.heartBeatStatus = "inactive"
                } else {
                    profile.heartBeatStatus = "active";
                }
            }
        };

        goodBrowsingProfile.forEach(updateProfileWithHeartbeat);
        badBrowsingProfile.forEach(updateProfileWithHeartbeat);

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
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

export const fetchUserMetrics = asyncHandler(async (req, res) => {
    try {
        const { id, month, year } = req.params; // Id of user we are visiting on dashboard

        const userObjectId = mongoose.Types.ObjectId.createFromHexString(id); // Convert userId to ObjectId once

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const previousMonth = month == 1 ? 12 : month - 1;
        const previousYear = month == 1 ? year - 1 : year;
        const startOfPreviousMonth = new Date(previousYear, previousMonth - 1, 1);
        const endOfPreviousMonth = new Date(previousYear, previousMonth, 0);

        const phishingClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, isPhishing: true, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId, } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        const blacklistedClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, status: "blacklisted", createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        const whitelistReqsCount = await WhitelistReq.countDocuments({
            userId: userObjectId,
            status: { $in: ["pending", "approved"] },
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

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
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        const previousPhishingClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, isPhishing: true, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId, } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        const previousBlacklistedClicksCount = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, status: "blacklisted", createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        const previousWhitelistReqsCount = await WhitelistReq.countDocuments({
            userId: userObjectId,
            status: { $in: ["pending", "approved"] },
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        });

        const previousApprovedWhitelistReq = await WhitelistReq.find({
            userId: userObjectId,
            status: { $in: ["pending", "approved"] },
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        }).select("_id");

        const previousWhitelistReqsIds = previousApprovedWhitelistReq.map(req => req._id);

        const previousVisitsToWhitelistUrls = await Url.aggregate([
            { $match: { whitelistReqIds: { $in: previousWhitelistReqsIds }, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        // Bar Graph Data (grouped by day)
        const visitsByDay = await Url.aggregate([
            { $match: { "visitedBy.userId": userObjectId, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
            { $unwind: "$visitedBy" },
            {
                $group: {
                    _id: { $dateToString: { format: "%d/%m/%Y", date: "$createdAt" } },
                    totalVisits: { $sum: "$visitedBy.totalVisits" },
                    blacklistedVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "blacklisted"] }, "$visitedBy.totalVisits", 0]
                        }
                    },
                    phishingVisits: {
                        $sum: {
                            $cond: [{ $eq: ["$isPhishing", true] }, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format bar graph data
        const barGraphData = {
            labels: visitsByDay.map(item => item._id),
            totalVisits: visitsByDay.map(item => item.totalVisits),
            blacklistedVisits: visitsByDay.map(item => item.blacklistedVisits),
            phishingVisits: visitsByDay.map(item => item.phishingVisits)
        };

        res.json({
            phishingClicks: phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0,
            blacklistedClicks: blacklistedClicksCount.length > 0 ? blacklistedClicksCount[0].total : 0,
            whitelistRequests: whitelistReqsCount,
            visitsToWhitelistUrls: visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0,
            percentagePhishingClicks: calculatePercentage(phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0, previousPhishingClicksCount.length > 0 ? previousPhishingClicksCount[0].total : 0),
            percentageBlacklistedClicks: calculatePercentage(blacklistedClicksCount.length > 0 ? blacklistedClicksCount[0].total : 0, previousBlacklistedClicksCount.length > 0 ? previousBlacklistedClicksCount[0].total : 0),
            percentageWhitelistReq: calculatePercentage(whitelistReqsCount || 0, previousWhitelistReqsCount || 0),
            percentageVisitToWhitelistUrls: calculatePercentage(visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0, previousVisitsToWhitelistUrls.length > 0 ? previousVisitsToWhitelistUrls[0].total : 0,),
            barGraphData
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
