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
import asyncHandler from '../middlewares/asyncHandler.js';
import getAdminLogsModel from '../models/adminlogsModel.js';
import { getTenantDB } from '../tenantdb.js';



// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const getAllLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const operationType = req.query.operationType || "all";
    const dateRangeFilter = req.query.dateRangeFilter || "all";
    const orgId = req.user.orgId;

    try {
        // ✅ Get the correct tenant database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            return res.status(500).json({ message: "Failed to initialize AdminLogs model." });
        }

        // ✅ Fetch logs from the tenant database
        const logs = await AdminLogs.aggregate([
            { $match: { orgId, ...getDateRange(dateRangeFilter), ...(operationType !== "all" ? { operationType } : {}) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            { $match: search ? {
                $or: [
                    { operationsPerformed: { $regex: search, $options: "i" } },
                    { "userDetails.name": { $regex: search, $options: "i" } }
                ]
            } : {} },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        // ✅ Count total logs
        const totalLogs = await AdminLogs.countDocuments({ orgId });

        // Fetch entity details for each log entry
        const logsWithDetails = await Promise.all(
            logs.map(async (log) => ({
                ...log,
                entityDetails: log.entityDetails || await getEntityDetails(log.entityType, log.entityId)
            }))
        );

        res.json({
            data: logsWithDetails,
            currentPage: page,
            totalPages: Math.ceil(totalLogs / limit),
            totalLogs
        });
    } catch (error) {
        console.error("❌ Error fetching Tenant logs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


export const exportLogsToCsv = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;

        // ✅ Get the correct tenant database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        // ✅ Get the correct AdminLogs model for this tenant
        const AdminLogs = getAdminLogsModel(tenantDb);
        if (!AdminLogs) {
            return res.status(500).json({ message: "Failed to initialize AdminLogs model." });
        }

        // ✅ Fetch logs for the organization from the tenant database
        const logs = await AdminLogs.aggregate([
            { $match: { orgId } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
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
                    "userDetails.department": 1
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        if (!logs.length) {
            return res.status(404).json({ message: "No logs found for the organization" });
        }

        // ✅ CSV Fields
        const fields = [
            { label: "Log ID", value: "_id" },
            { label: "Operation Type", value: "operationType" },
            { label: "Operations Performed", value: "operationsPerformed" },
            { label: "Created At", value: "createdAt" },
            { label: "Entity ID", value: "entityId" },
            { label: "Entity Type", value: "entityType" },
            { label: "Entity Details", value: (row) => JSON.stringify(row.entityDetails) || "NA" },
            { label: "User Name", value: "userDetails.name" },
            { label: "User Email", value: "userDetails.email" },
            { label: "User Department", value: "userDetails.department" }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        // ✅ Save file temporarily
        const filePath = path.join(__dirname, "..", "exports", `logs_${orgId}_${Date.now()}.csv`);
        fs.writeFileSync(filePath, csv);

        res.download(filePath, `logs_${orgId}_${Date.now()}.csv`, (err) => {
            if (err) {
                console.error("❌ Error downloading the CSV file:", err);
                return res.status(500).json({ message: "Error downloading the CSV file" });
            }

            // ✅ Delete file after download
            setTimeout(() => fs.unlinkSync(filePath), 5000);
        });

    } catch (error) {
        console.error("❌ Error exporting logs to CSV:", error);
        res.status(500).json({ message: "Error exporting logs to CSV", error: error.message });
    }
});

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

const getEntityDetails = async (entityType, entityId, orgId) => {
    if (!orgId) {
        console.error("❌ Missing orgId in getEntityDetails function");
        return {};
    }

    let entityDetails = {};

    try {
        // ✅ Get the tenant database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            console.error(`❌ Failed to get tenant database for orgId: ${orgId}`);
            return {};
        }

        // ✅ Register models dynamically in the tenant DB
        const User = tenantDb.models.User || tenantDb.model("User", UserSchema);
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const WhitelistReq = tenantDb.models.WhitelistReq || tenantDb.model("WhitelistReq", WhitelistReqSchema);

        // ✅ Fetch entity details dynamically
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

            default:
                console.warn(`⚠️ Unknown entity type: ${entityType}`);
        }
    } catch (error) {
        console.error(`❌ Error fetching entity details for ${entityType} (${entityId}):`, error);
    }

    return entityDetails;
};

