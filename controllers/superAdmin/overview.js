import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualUserModel.js";
import { getOrgModel } from "../../models/organisationModel.js";


export const getSignupStats = asyncHandler(async (req, res) => {
    const OrgModel = await getOrgModel();
    const orgStatus = await OrgModel.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                totalOrganization: { $sum: 1 },
                orgUserCount: { $sum: "$usersCount" },
                freemiumCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "freemium"] }, 1, 0] }
                },
                paidCount: {
                    $sum: { $cond: [{ $eq: ["$subscription", "paid"] }, 1, 0] }
                }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const GlobalUser = await getIndividualUserModel();
    const individualStats = await GlobalUser.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                totalIndividuals: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])


    const statsMap = {};

    orgStatus.forEach(stat => {
        const key = `${stat._id.year}-${stat._id.month}`;
        statsMap[key] = {
            year: stat._id.year,
            month: stat._id.month,
            totalOrganizations: stat.totalOrganization,
            orgUserCount: stat.orgUserCount,
            freemiumCount: stat.freemiumCount,
            paidCount: stat.paidCount,
            totalIndividuals: 0
        };
    });

    individualStats.forEach(stat => {
        const key = `${stat._id.year}-${stat._id.month}`;
        if (statsMap[key]) {
            statsMap[key].totalIndividuals = statsMap.totalIndividuals;
        } else {
            statsMap[key] = {
                year: stat._id.year,
                month: stat._id.month,
                totalOrganizations: 0,
                orgUserCount: 0,
                freemiumCount: 0,
                paidCount: 0,
                totalIndividuals: stat.totalIndividuals
            };
        }
    });

    const combinedStats = Object.values(statsMap).map(item => ({
        ...item,
        combinedTotalUsers: (item.orgUserCount || 0) + (item.totalIndividuals || 0)
    }));

    res.status(200).json({ stats: combinedStats });

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
})