import Url from "../models/urlModel.js";
import WhitelistReq from "../models/whitelistReqModel.js";

export const fetchOrgMetrics = async (req, res) => {
    const { orgId } = req.query;

    try{
        const approvedWhitelistCount = await WhitelistReq.countDocuments({
            orgId: parseInt(orgId),
            status: "approved"
        });

        const blacklistedUrlsCount = await Url.countDocuments({
            orgId: parseInt(orgId),
            isBlacklisted: true
        });

        const urlsCount = await Url.countDocuments({
            orgId: parseInt(orgId)
        });

        const orgMetrics = await Url.aggregate([
            {$match: {orgId: parseInt(orgId)}},
            {$unwind: "$visitedBy"},
            {
                $group: {
                    _id: null,
                    totalOrgVisits: {$sum: "$visitedBy.totalVisits"},
                    totalOrgBlacklistedVisits: {
                        $sum: {
                            $cond:[{$eq: ["$isBlacklisted", true]}, "$visitedBy.totalVisits", 0]
                        }
                    },
                    totalOrgPhishingVisits: {
                        $sum:{
                            $cond: [{eq: ["$isPhishing", true]}, "$visitedBy.totalVisits", 0]
                        }
                    }
                }
            }
        ]);

        let response = {
            totalApprovedWhitelistRequests: approvedWhitelistCount,
            totalUrls: urlsCount,
            totalBlacklistedUrls: blacklistedUrlsCount,
            totalOrgVisits: orgMetrics[0]?.totalOrgVisits || 0,
            totalOrgBlacklistedVisits: orgMetrics[0]?.totalOrgBlacklistedVisits || 0,
            totalOrgPhishingVisits: orgMetrics[0]?.totalOrgPhishingVisits || 0,
        };
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
};