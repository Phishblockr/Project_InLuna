import Url from "../models/urlModel.js";
import WhitelistReq from "../models/whitelistReqModel.js";
import asyncHandler from '../middlewares/asyncHandler.js';
import mongoose from 'mongoose';

const calculatePercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

export const fetchOrgMetrics = async (req, res) => {
    const { month, year } = req.query;

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
            isBlacklisted: true,
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        });

        const previousBlacklistedUrlsCount = await Url.countDocuments({
            orgId: orgId,
            isBlacklisted: true,
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
                            $cond: [{ $eq: ["$isBlacklisted", true] }, "$visitedBy.totalVisits", 0]
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
                            $cond: [{ $eq: ["$isBlacklisted", true] }, "$visitedBy.totalVisits", 0]
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
            )

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
            { $match: { "visitedBy.userId": userObjectId, isBlacklisted: true, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
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
            status: "approved",
            createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }).select("_id");

        const whitelistReqsId = approvedWhitelistReq.map(req => req._id);

        const visitsToWhitelistUrls = await Url.aggregate([
            { $match: { whitelistReqId: { $in: whitelistReqsId }, createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
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
            { $match: { "visitedBy.userId": userObjectId, isBlacklisted: true, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
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
            status: "approved",
            createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth }
        }).select("_id");

        const previousWhitelistReqsId = previousApprovedWhitelistReq.map(req => req._id);

        const previousVisitsToWhitelistUrls = await Url.aggregate([
            { $match: { whitelistReqId: { $in: previousWhitelistReqsId }, createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userObjectId } },
            { $group: { _id: null, total: { $sum: "$visitedBy.totalVisits" } } },
            { $project: { _id: 0, total: 1 } }
        ]);

        res.json({
            phishingClicks: phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0,
            blacklistedClicks: blacklistedClicksCount.length > 0 ? blacklistedClicksCount[0].total : 0,
            whitelistRequests: whitelistReqsCount,
            visitsToWhitelistUrls: visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0,
            percentagePhishingClicks: calculatePercentage(phishingClicksCount.length > 0 ? phishingClicksCount[0].total : 0, previousPhishingClicksCount.length > 0 ? previousPhishingClicksCount[0].total : 0),
            percentageBlacklistedClicks: calculatePercentage(blacklistedClicksCount.length > 0 ? blacklistedClicksCount[0].total : 0, previousBlacklistedClicksCount.length > 0 ? previousBlacklistedClicksCount[0].total : 0),
            percentageWhitelistReq: calculatePercentage(whitelistReqsCount || 0, previousWhitelistReqsCount || 0),
            percentageVisitToWhitelistUrls: calculatePercentage(visitsToWhitelistUrls.length > 0 ? visitsToWhitelistUrls[0].total : 0, previousVisitsToWhitelistUrls.length > 0 ? previousVisitsToWhitelistUrls[0].total : 0,)
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
