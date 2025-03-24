import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualUserModel.js";
import { getOrgModel } from "../../models/organisationModel.js";


export const getStatsGraph = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ error: "Month and year are required." });
    }

    // Create start and end dates for the requested month.
    // Note: JavaScript Date months are 0-indexed (0 = January, etc.)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // Exclusive end date (start of the next month)

    // --- Organizations Aggregation ---
    const OrgModel = await getOrgModel();
    const orgStats = await OrgModel.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalOrganizations: { $sum: 1 },
                orgUserCount: { $sum: "$usersCount" }, // assuming "usersCount" field stores org's user count
                freemiumCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "freemium"] }, 1, 0] }
                },
                paidCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "paid"] }, 1, 0] }
                }
            }
        }
    ]);

    // --- Individual Users Aggregation ---
    const GlobalUser = await getIndividualUserModel();
    const individualStats = await GlobalUser.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalIndividuals: { $sum: 1 }
            }
        }
    ]);

    // Default values if no documents match
    const orgData = orgStats[0] || {
        totalOrganizations: 0,
        orgUserCount: 0,
        freemiumCount: 0,
        paidCount: 0
    };

    const indData = individualStats[0] || { totalIndividuals: 0 };

    const combinedTotalUsers = orgData.orgUserCount + indData.totalIndividuals;

    res.status(200).json({
        month,
        year,
        totalOrganizations: orgData.totalOrganizations,
        orgUserCount: orgData.orgUserCount,
        freemiumOrgCount: orgData.freemiumCount,
        paidOrgCount: orgData.paidCount,
        totalIndividuals: indData.totalIndividuals,
        combinedTotalUsers: combinedTotalUsers
    });
});

export const getOverallStats = asyncHandler(async (req, res) => {
    const OrgModel = await getOrgModel();
    const orgStats = await OrgModel.aggregate([
        {
            $group: {
                _id: null,
                totalOrganizations: { $sum: 1 },
                orgUserCount: { $sum: "$usersCount" },
                freemiumCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "freemium"] }, 1, 0] }
                },
                paidCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "paid"] }, 1, 0] }
                }
            }
        }
    ]);

    const IndividualUser = await getIndividualUserModel();
    const individualStats = await IndividualUser.aggregate([
        {
            $group: {
                _id: null,
                totalIndividuals: {
                    $sum: 1
                },
                freemiumCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "freemium"] }, 1, 0] }
                },
                paidCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "paid"] }, 1, 0] }
                }
            }
        }
    ]);

    const orgData = orgStats[0] || {
        totalOrganizations: 0,
        orgUserCount: 0,
        freemiumCount: 0,
        paidCount: 0
    };

    const indData = individualStats[0] || {
        totalIndividuals: 0,
        freemiumCount: 0,
        paidCount: 0
    }

    const combinedTotalUsers = orgData.orgUserCount + indData.totalIndividuals;

    res.status(200).json({
        totalOrganizations: orgData.totalOrganizations,
        orgUserCount: orgData.orgUserCount,
        freemiumOrgCount: orgData.freemiumCount,
        paidOrgCount: orgData.paidCount,
        freemiumIndCount: indData.freemiumCount,
        paidIndCount: indData.paidCount,
        totalIndividuals: indData.totalIndividuals,
        combinedTotalUsers: combinedTotalUsers
    });
});

export const getMonthlySignups = asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res.status(400).json({ error: "Month and year are required." });
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const OrgModel = await getOrgModel();
    const orgAggregation = await OrgModel.aggregate([
        {
            $match: {
                createdAt: {$gte: startDate, $lt: endDate}
            }
        },
        {
            $group: {
                _id: null,
                organizationSignups: {$sum: 1}
            }
        }
    ]);

    const organizationSignups = orgAggregation[0] ?
    orgAggregation[0].organizationSignups : 0;

    const IndividualUser = await getIndividualUserModel();
    const individualAggregation = await IndividualUser.aggregate([
        {
            $match: {
                createdAt: {$gte: startDate, $lt: endDate}
            }
        },
        {
            $group: {
                _id: null,
                individualSignups: {$sum: 1}
            }
        }
    ]);

    const individualSignups = individualAggregation[0] ?
    individualAggregation[0].individualSignups : 0;

    res.status(200).json({
        month,
        year,
        organizationSignups,
        individualSignups
    });
});