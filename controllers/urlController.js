import UrlSchema from '../models/urlModel.js';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import asyncHandler from '../middlewares/asyncHandler.js';
import fs from 'fs';
import csvParser from 'csv-parser';

// for adminLog
import { getTenantDB } from '../tenantdb.js';
import getAdminLogsModel from '../models/adminlogsModel.js';

// Helper function to normalize URLs by removing 'www.' and ensuring the URL starts with 'https://'
function normalizeUrl(url) {
    // console.log(url);

    try {
        // If the URL doesn't start with "http://" or "https://", add "https://"
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // Parse the URL using the URL constructor (works in Node.js and browser)
        const parsedUrl = new URL(url);

        // Remove "www." if it exists
        const normalizedHost = parsedUrl.hostname.replace(/^www\./, '');

        // Return the normalized URL (with 'https://')
        return `${parsedUrl.protocol}//${normalizedHost}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch (error) {
        throw new Error('Invalid URL');
    }
}

// Add a new URL entry with normalization
export const addUrlExt = asyncHandler(async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(`${req.user.userId}`);
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct Url model for this tenant
        if (!tenantDb.models.Url) {
            tenantDb.model("Url", UrlSchema);
        }
        const Url = tenantDb.models.Url;

        const { url, isVerified, isPhishing, isUserAdded, category } = req.body;

        //  Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        //  Check if URL already exists
        let existingUrl = await Url.findOne({ url: normalizedUrl, orgId });

        if (existingUrl) {
            //  Update existing URL entry
            let visitor = existingUrl.visitedBy.find(v => v.userId.equals(userId));
            if (visitor) {
                visitor.visits.push({ timestamp: new Date() });
                visitor.totalVisits += 1;
            } else {
                existingUrl.visitedBy.push({
                    userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                });
            }

            await existingUrl.save();
            return res.status(200).json(existingUrl);
        }

        //  Create a new URL entry
        const newUrl = new Url({
            url: normalizedUrl,
            visitedBy: [{
                userId,
                visits: [{ timestamp: new Date() }],
                totalVisits: 1,
            }],
            category: category || ["general"],
            isVerified: isVerified ?? false,
            isPhishing: isPhishing ?? true,
            isUserAdded: isUserAdded ?? false,
            orgId
        });

        await newUrl.save();

        //  Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("urlAdded", newUrl);
        }

        res.status(201).json(newUrl);
    } catch (error) {
        console.error(" Error adding URL:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Fetch URL stats based on user visits
export const fetchUrlStatsExt = asyncHandler(async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(`${req.user.userId}`);
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct Url model for this tenant
        if (!tenantDb.models.Url) {
            tenantDb.model("Url", UrlSchema);
        }
        const Url = tenantDb.models.Url;

        //  Aggregate query to count URL visits and blacklist status
        const result = await Url.aggregate([
            { $match: { orgId } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userId } },
            {
                $group: {
                    _id: "$status",
                    totalVisits: { $sum: "$visitedBy.totalVisits" }
                }
            }
        ]);

        let response = {
            blacklistedUrls: 0,
            visitedUrls: 0,
        };

        result.forEach(item => {
            if (item._id === "blacklisted") {
                response.blacklistedUrls = item.totalVisits;
            } else {
                response.visitedUrls = item.totalVisits;
            }
        });

        res.status(200).json(response);
    } catch (error) {
        console.error(" Error fetching URL stats:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Unshorten a URL to its full form
export const unshortenUrl = async (req, res) => {
    let shortUrl = req.query.url;

    // Validate the URL input
    if (!shortUrl) {
        return res.status(400).json({ error: 'No URL provided' });
    }
    if (!shortUrl.startsWith("https://") && !shortUrl.startsWith("http://")) {
        shortUrl = "https://" + shortUrl; // Default to HTTPS
    }

    try {
        // Perform a HEAD request
        const response = await fetch(shortUrl, {
            method: "HEAD",
            redirect: "manual",
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
        });

        if (response.status === 301 || response.status === 302) {
            // URL was redirected, return the expanded URL
            const expandedUrl = response.headers.get("Location");
            return res.json({ requested_url: shortUrl, resolved_url: expandedUrl, success: true });
        } else if (response.status >= 200 && response.status < 300) {
            // URL is valid but not redirected (not shortened)
            return res.json({ requested_url: shortUrl, resolved_url: shortUrl, success: false });
        } else {
            // URL returned an error status
            return res.status(response.status).json({ error: "Unable to resolve URL", status: response.status });
        }
    } catch (error) {
        // console.error("Error expanding URL:", error.message);

        if (error.code === 'EAI_AGAIN') {
            return res.status(503).json({ error: "DNS resolution failed. Please try again later." });
        }
        return res.status(500).json({ error: "Failed to expand URL", details: error.message });
    }
};

// Dashboard APIs for URL management
export const getUrls = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "all";

    const orgId = req.user.orgId;

    if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required." });
    }

    try {
        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct Url model for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);

        //  Apply filters
        const searchFilter = search
            ? { $or: [{ url: { $regex: search, $options: "i" } }] }
            : {};

        const statusFilter =
            status === "all"
                ? {}
                : { status: { $regex: `^${status}$`, $options: "i" } };

        const queryFilter = { orgId, ...searchFilter, ...statusFilter };

        //  Fetch URLs with pagination
        const urls = await Url.find(queryFilter).skip(skip).limit(limit);
        const totalUrls = await Url.countDocuments(queryFilter);

        if (urls.length > 0) {
            res.status(200).json({
                urls,
                currentPage: page,
                totalPages: Math.ceil(totalUrls / limit),
                totalUrls,
            });
        } else {
            res.status(404).json({ error: "No URLs found" });
        }
    } catch (error) {
        console.error(" Error fetching URLs:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Add a new URL
export const addUrl = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const { url, isVerified, isPhishing, category, status } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        const categoryArray = Array.isArray(category) ? category : [category];

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct models for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const AdminLogs = getAdminLogsModel(tenantDb);

        //  Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        //  Check if the URL already exists in the tenant's DB
        const existingUrl = await Url.findOne({ url: normalizedUrl, orgId });

        if (existingUrl) {
            return res.status(400).json({ error: "URL already exists" });
        }

        //  Create new URL entry
        const newUrl = new Url({
            url: normalizedUrl,
            category: categoryArray,
            isVerified,
            isPhishing,
            status,
            isUserAdded: true,
            orgId
        });

        await newUrl.save();

        //  Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("urlAdded", newUrl);
        }

        //  Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "add",
                operationsPerformed: `Added URL: ${url} with status ${status}`,
                orgId,
                entityId: newUrl._id,
                entityType: "url"
            });
            console.log(" Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error(" Failed to create log in tenant DB:", logError.message);
        }

        res.status(201).json(newUrl);
    } catch (error) {
        console.error(" Error adding URL:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Update an existing URL
export const updateUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        let { url, category, status, isPhishing, isVerified } = req.body;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct models for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const AdminLogs = getAdminLogsModel(tenantDb);

        //  Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        const updates = {
            url: normalizedUrl,
            category,
            status,
            isPhishing,
            isVerified,
        };

        //  Update the URL in the tenant database
        const updatedUrl = await Url.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!updatedUrl) {
            return res.status(404).json({ error: "URL not found" });
        }

        //  Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("urlUpdated", updatedUrl);
        }

        //  Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "update",
                operationsPerformed: `Updated URL ID: ${id} with status: ${status}, phishing: ${isPhishing}, isVerified: ${isVerified}`,
                orgId,
                entityId: id,
                entityType: "url"
            });
            console.log(" Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error(" Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json(updatedUrl);
    } catch (error) {
        console.error(" Error updating URL:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Delete a URL
export const deleteUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct models for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const AdminLogs = getAdminLogsModel(tenantDb);

        //  Find the URL in the tenant's DB
        const urlData = await Url.findById(id);
        if (!urlData) {
            return res.status(404).json({ message: "URL not found" });
        }

        //  Delete the URL from the tenant's DB
        await Url.findByIdAndDelete(id);

        //  Emit WebSocket Event if available
        const io = req.app.get("socketio");
        if (io) {
            io.emit("urlDeleted", id);
        }

        //  Add Log Entry in the Correct Tenant Database
        try {
            await AdminLogs.create({
                userId,
                operationType: "delete",
                operationsPerformed: `Deleted URL ID: ${id}`,
                orgId,
                entityId: id,
                entityType: "url",
                entityDetails: {
                    identifier: urlData.url,
                    status: urlData.status,
                    extraInfo: `Category: ${urlData.category}`
                }
            });
            console.log(" Log entry created successfully in tenant DB:", orgId);
        } catch (logError) {
            console.error(" Failed to create log in tenant DB:", logError.message);
        }

        res.status(200).json({ message: `URL ${urlData.url} deleted successfully`, id });
    } catch (error) {
        console.error(" Error deleting URL:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Add URLs from a CSV file
export const addUrlFromCsv = asyncHandler(async (req, res) => {
    const filePath = req.file.path;
    const urls = [];
    const errors = [];
    const userId = req.user.userId;
    const orgId = req.user.orgId;

    if (!orgId) {
        return res.status(400).json({ message: "Organization ID is required." });
    }

    const { urlHeader, categoryHeader, status, isPhishing, isVerified } = req.body;

    try {
        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct models for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);
        const AdminLogs = getAdminLogsModel(tenantDb);

        //  Fetch existing URLs from the tenant database to avoid duplicates
        const existingUrls = new Set(await Url.find({ orgId }).distinct("url"));

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on("data", (row) => {
                    const url = row[urlHeader]?.trim();
                    const category = categoryHeader ? (row[categoryHeader]?.split(",").map(tag => tag.trim()) || []) : [];

                    if (!url) {
                        errors.push({ row, error: `Missing URL value` });
                        return;
                    }
                    if (existingUrls.has(url)) {
                        return; // Skip duplicate URLs
                    }

                    //  Normalize the URL before saving
                    const normalizedUrl = normalizeUrl(url);

                    const urlEntry = {
                        url: normalizedUrl,
                        category,
                        status,
                        isPhishing,
                        isVerified,
                        orgId
                    };

                    urls.push(urlEntry);
                    existingUrls.add(url);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        if (urls.length > 0) {
            //  Insert valid URLs into the tenant database
            const insertedUrls = await Url.insertMany(urls);

            //  Emit WebSocket Event if available
            const io = req.app.get("socketio");
            if (io) {
                io.emit("urlsByCsvAdded", insertedUrls);
            }

            //  Add Log Entry in the Correct Tenant Database
            try {
                await AdminLogs.create({
                    userId,
                    operationType: "add",
                    operationsPerformed: "Added URLs via CSV",
                    orgId
                });
                console.log(" Log entry created successfully in tenant DB:", orgId);
            } catch (logError) {
                console.error(" Failed to create log in tenant DB:", logError.message);
            }

            res.status(200).json({ message: "URLs added successfully" });
        } else {
            res.status(400).json({ message: "No valid URLs to add or all URLs are duplicates" });
        }
    } catch (error) {
        console.error(" Error adding URLs from CSV:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    } finally {
        //  Remove the uploaded CSV file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});


// Controller to get all blacklisted URLs
export const getBlacklistedUrls = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct Url model for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);

        //  Fetch blacklisted URLs from the tenant's DB
        const blacklistedUrls = await Url.find({ orgId, status: "blacklisted" });

        if (!blacklistedUrls.length) {
            return res.status(404).json({ message: "No blacklisted URLs found" });
        }

        //  Extract and return only the URLs
        const urls = blacklistedUrls.map((urlEntry) => urlEntry.url);
        res.status(200).json({ urls });
    } catch (error) {
        console.error(" Error fetching blacklisted URLs:", error.message);
        res.status(500).json({ error: error.message });
    }
});

export const fetchUrl = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;
        const { url } = req.query;

        if (!orgId) {
            return res.status(400).json({ message: "Organization ID is required." });
        }
        if (!url) {
            return res.status(400).json({ message: "URL is required." });
        }

        //  Normalize the URL before searching
        const normalizedUrl = normalizeUrl(url);

        //  Get the tenant-specific database connection
        const tenantDb = await getTenantDB(orgId);
        if (!tenantDb) {
            return res.status(500).json({ message: "Failed to get tenant database." });
        }

        //  Get the correct Url model for this tenant
        const Url = tenantDb.models.Url || tenantDb.model("Url", UrlSchema);

        //  Fetch URL from the tenant's DB
        const urlData = await Url.findOne({ url: normalizedUrl, orgId });

        if (!urlData) {
            return res.status(404).json({ error: "URL does not exist in the database." });
        }

        res.status(200).json({ urlData });
    } catch (error) {
        console.error(" Error fetching URL:", error.message);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});