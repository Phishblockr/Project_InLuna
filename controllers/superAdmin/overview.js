import { response } from "express";
import asyncHandler from "../../middlewares/asyncHandler.js";
import { getIndividualUserModel } from "../../models/individualModels/individualUserModel.js";
import { getOrgModel } from "../../models/organisationModel.js";
import { getUrlModel } from "../../models/urlModel.js";

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

export const getLastMonthSignups = asyncHandler(async (req, res) => {
    // Calculate last month based on the current date.
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = lastMonthDate.getMonth() + 1;
    const year = lastMonthDate.getFullYear();

    // Define the date range for last month.
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const OrgModel = await getOrgModel();
    const orgAggregation = await OrgModel.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                organizationSignups: { $sum: 1 }
            }
        }
    ]);

    const organizationSignups = orgAggregation[0]
        ? orgAggregation[0].organizationSignups
        : 0;

    const IndividualUser = await getIndividualUserModel();
    const individualAggregation = await IndividualUser.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: null,
                individualSignups: { $sum: 1 }
            }
        }
    ]);

    const individualSignups = individualAggregation[0]
        ? individualAggregation[0].individualSignups
        : 0;

    res.status(200).json({
        month,
        year,
        organizationSignups,
        individualSignups
    });
});

export const getLastWeekSignups = asyncHandler(async (req, res) => {
    const now = new Date();

    const currentWeekMonday = new Date(now);
    if (now.getDay() === 0) {
        // If today is Sunday, consider Monday 6 days ago.
        currentWeekMonday.setDate(now.getDate() - 6);
    } else {
        currentWeekMonday.setDate(now.getDate() - (now.getDay() - 1));
    }

    // Calculate last week's Monday (start) and last week's end (current week's Monday, exclusive)
    const lastWeekStart = new Date(currentWeekMonday);
    lastWeekStart.setDate(currentWeekMonday.getDate() - 7);
    const lastWeekEnd = new Date(currentWeekMonday); // exclusive

    // Aggregate organization signups for last week
    const OrgModel = await getOrgModel();
    const orgAggregation = await OrgModel.aggregate([
        {
            $match: {
                createdAt: { $gte: lastWeekStart, $lt: lastWeekEnd }
            }
        },
        {
            $group: {
                _id: null,
                organizationSignups: { $sum: 1 }
            }
        }
    ]);
    const organizationSignups = orgAggregation[0]
        ? orgAggregation[0].organizationSignups
        : 0;

    // Aggregate individual user signups for last week
    const IndividualUser = await getIndividualUserModel();
    const individualAggregation = await IndividualUser.aggregate([
        {
            $match: {
                createdAt: { $gte: lastWeekStart, $lt: lastWeekEnd }
            }
        },
        {
            $group: {
                _id: null,
                individualSignups: { $sum: 1 }
            }
        }
    ]);
    const individualSignups = individualAggregation[0]
        ? individualAggregation[0].individualSignups
        : 0;

    res.status(200).json({
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        organizationSignups,
        individualSignups
    });
})

