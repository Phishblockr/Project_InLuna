import mongoose from 'mongoose';
import AdminLogs from "../models/adminlogsModel.js"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';
import { Parser } from 'json2csv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Url from '../models/urlModel.js';
import User from '../models/userModel.js';
import WhitelistReq from '../models/RequestModel.js';



// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
                    entityId: 1,
                    entityType: 1,
                    entityDetails: 1,
                    "userDetails._id": 1,
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

        const logsWithDetails = await Promise.all(logs.map(async (log) => {
            const entityDetails = log.entityDetails || await getEntityDetails(log.entityType, log.entityId);
            return {
                ...log,
                entityDetails,
            };
        }));

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
            data: logsWithDetails,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const exportLogsToCsv = async (req, res) => {
    try {
        const orgId = req.user.orgId;
        const logs = await AdminLogs.aggregate([
            {
                $match: { orgId }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    operationType: 1,
                    operationsPerformed: 1,
                    createdAt: 1,
                    entityId: 1,
                    entityType: 1,
                    entityDetails: 1,
                    "userDetails.name": 1,
                    "userDetails.email": 1,
                    "userDetails.department": 1,
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        if (!logs || logs.length === 0) {
            return res.status(404).json({ message: 'No logs found for the organization' });
        }
        const fields = [
            { label: 'Log ID', value: '_id' },
            { label: 'Operation Type', value: (row) => row.operationType || 'NA' },
            { label: 'Operations Performed', value: (row) => row.operationsPerformed || 'NA' },
            { label: 'Created At', value: (row) => row.createdAt || 'NA' },
            { label: 'Entity ID', value: (row) => row.entityId || 'NA' },
            { label: 'Entity Type', value: (row) => row.entityType || 'NA' },
            { label: 'Entity Details', value: (row) => row.entityDetails ? JSON.stringify(row.entityDetails) : 'NA' }, // Convert object to string or 'NA'
            { label: 'User Name', value: (row) => row.userDetails.name || 'NA' },
            { label: 'User Email', value: (row) => row.userDetails.email || 'NA' },
            { label: 'User Department', value: (row) => row.userDetails.department || 'NA' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        const filePath = path.join(__dirname, '..', 'exports', `logs_${orgId}_${Date.now()}.csv`);
        fs.writeFileSync(filePath, csv);

        res.download(filePath, `logs_${Date.now()}.csv`, (err) => {
            if (err) {
                console.error('Error downloading the CSV file:', err);
                return res.status(500).json({ message: 'Error downloading the CSV file' });
            }

            // Optionally, delete the file after download
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error('Error exporting logs to CSV:', error);
        res.status(500).json({ message: 'Error exporting logs to CSV', error: error.message });
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

const getEntityDetails = async (entityType, entityId) => {
    let entityDetails = {};

    switch (entityType) {
        case "user":
            const user = await User.findById(entityId);
            if (user) {
                entityDetails = {
                    identifier: user.email,
                    status: user.status,      
                    extraInfo: `Department: ${user.department}`,        
                };
            }
            break;

        case "url":
            const url = await Url.findById(entityId);
            if (url) {
                entityDetails = {
                    identifier: url.url,     
                    status: url.status,      
                    extraInfo: `Category: ${url.category.join(", ")}`,
                };
            }
            break;

        case "whitelistReq":
            const whitelistReq = await WhitelistReq.findById(entityId);
            if (whitelistReq) {
                entityDetails = {
                    identifier: whitelistReq.url,
                    status: whitelistReq.status,    
                    extraInfo: `Reason: ${whitelistReq.reason}`, 
                    from: whitelistReq.userId,      
                };
            }
            break;
    }

    return entityDetails;
};
