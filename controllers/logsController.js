import mongoose from 'mongoose';
import AdminLogs from "../models/adminlogsModel.js"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

export const getAllLogs = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || ""
    const operationType = req.query.operationType || "all";
    const dateRangeFilter = req.query.dateRangeFilter || "all"

    const orgId = req.user.orgId;

    const searchFilter = search ? {
        $or: [
            { operationsPerformed: { $regex: search, $options: "i" } },
            { "userDetails.name": { $regex: search, $options: "i" } }
        ]
    } : {};

    const operationTypeFilter = operationType == "all" ? {} : { operationType };
    const dateFilter = getDateRange(dateRangeFilter);
    try {
        const logs = await AdminLogs.aggregate([
            { $match: { orgId, ...operationTypeFilter, ...dateFilter } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            { $match: searchFilter },
            {
                $project: {
                    _id: 1,
                    operationType: 1,
                    operationsPerformed: 1,
                    createdAt: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    "userDetails.department": 1,
                    "userDetails.img": 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        const totalLogsAggregation = await AdminLogs.aggregate([
            { $match: { orgId, ...operationTypeFilter, ...dateFilter } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails",
                }
            },
            { $unwind: "$userDetails" },
            { $match: searchFilter },
            { $count: "totalCount" },
        ]);
        const totalLogs = totalLogsAggregation[0]?.totalCount || 0;

        res.json({
            data: logs,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getDateRange = (filter) => {
    const today = new Date();

    switch (filter) {
        case "this_week":
            return { createdAt: { $gte: startOfWeek(today), $lte: endOfWeek(today) } };
        case "last_week":
            return { createdAt: { $gte: startOfWeek(subWeeks(today, 1)), $lte: endOfWeek(subWeeks(today, 1)) } };
        case "this_month":
            return { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } };
        case "last_month":
            return { createdAt: { $gte: startOfMonth(subMonths(today, 1)), $lte: endOfMonth(subMonths(today, 1)) } };
        case "this_quarter":
            return { createdAt: { $gte: startOfQuarter(today), $lte: endOfQuarter(today) } };
        case "last_quarter":
            return { createdAt: { $gte: startOfQuarter(subQuarters(today, 1)), $lte: endOfQuarter(subQuarters(today, 1)) } };
        case "this_year":
            return { createdAt: { $gte: startOfYear(today), $lte: endOfYear(today) } };
        case "last_year":
            return { createdAt: { $gte: startOfYear(subYears(today, 1)), $lte: endOfYear(subYears(today, 1)) } };
        default:
            return {}; // No date filter for 'all'
    }
};
