import Url from "../models/urlModel.js";
import WhitelistReq from "../models/whitelistReqModel.js";

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

        const calculatePercentage = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        }

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