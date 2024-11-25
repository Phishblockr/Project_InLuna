import Url from '../models/urlModel.js';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import asyncHandler from '../middlewares/asyncHandler.js';
import fs from 'fs';
import csvParser from 'csv-parser';

// for adminLog
import AdminLogs from "../models/adminlogsModel.js";

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
export const addUrlExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

        const visitedBy = [{ userId }];
        const { url, isVerified, isPhishing, isUserAdded, category } = req.body;

        // Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        const existingUrls = await Url.findOne({ url: normalizedUrl, orgId: orgId });

        if (existingUrls) {
            let visitor = existingUrls.visitedBy.find(v => v.userId.equals(visitedBy[0].userId));
            if (visitor) {
                visitor.visits.push({ timestamp: new Date() });
                visitor.totalVisits += 1;
            } else {
                existingUrls.visitedBy.push({
                    userId: visitedBy[0].userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                });
            }
            await existingUrls.save();
            res.status(200).send(existingUrls);
        } else {
            const newUrl = new Url({
                url: normalizedUrl,
                visitedBy: [{
                    userId: visitedBy[0].userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1,
                }],
                category: category,
                isVerified: isVerified,
                isPhishing: isPhishing,
                isUserAdded: isUserAdded,
                orgId: orgId
            });
            await newUrl.save();
            const io = req.app.get("socketio");
            io.emit("urlAdded", newUrl);
            res.status(201).send(newUrl);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Fetch URL stats based on user visits
export const fetchUrlStatsExt = async (req, res) => {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
    const orgId = req.user.orgId;
    try {
        const result = await Url.aggregate([
            { $match: { orgId: orgId } },
            { $unwind: "$visitedBy" },
            { $match: { "visitedBy.userId": userId } },
            {
                $group: {
                    _id: "$isBlacklisted",
                    totalVisits: { $sum: "$visitedBy.totalVisits" }
                }
            }
        ]);

        let response = {
            blacklistedUrls: 0,
            visitedUrls: 0,
        };

        result.forEach(item => {
            if (item._id) {
                response.blacklistedUrls = item.totalVisits;
            } else {
                response.visitedUrls = item.totalVisits;
            }
        });

        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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
    const search = req.query.search || ""
    const status = req.query.status || "all";

    const orgId = req.user.orgId;
    const searchFilter = search ? {
        $or: [
            { url: { $regex: search, $options: "i" } },
        ]
    } : {};

    const statusFilter = status === "all" ? {} : {
        status: { $regex: `^${status}$`, $options: "i" }
    };

    const queryFilter = { orgId: orgId, ...searchFilter, ...statusFilter };

    const urls = await Url.find(queryFilter).skip(skip).limit(limit);
    const totalUrls = await Url.countDocuments(queryFilter);
    if (urls.length > 0) {
        res.status(200).json({ urls, currentPage: page, totalPages: Math.ceil(totalUrls / limit), totalUrls })
    } else {
        res.status(400).json({ error: "Urls not found" })
    }
});

// Add a new URL
export const addUrl = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const { url, isVerified, isPhishing, category, status } = req.body;
        const categoryArray = Array.isArray(category) ? category : [category];

        // Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        const existingUrls = await Url.findOne({ url: normalizedUrl, orgId: orgId });
        if (existingUrls) {
            res.status(400).json({ error: "Url already exists" });
        } else {
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
            const io = req.app.get("socketio");
            io.emit("urlAdded", newUrl);

            // Add Log entry
            await AdminLogs.create({
                userId,
                operationType: "add",
                operationsPerformed: `Added URL: ${url} with status ${status}`,
                orgId,
                entityId: newUrl._id,
                entityType: "url"
            });
            res.status(201).send(newUrl);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Update an existing URL
export const updateUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        let { url, category, status, isPhishing, isVerified } = req.body;

        // Normalize the URL before saving
        const normalizedUrl = normalizeUrl(url);

        const updates = {
            url: normalizedUrl,
            category,
            status,
            isPhishing,
            isVerified,
        };
        const updatedUrl = await Url.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (updatedUrl) {
            const io = req.app.get("socketio");
            io.emit("urlUpdated", updatedUrl);

            // Add Log entry
            await AdminLogs.create({
                userId,
                operationType: "update",
                operationsPerformed: `Updated URL ID: ${id} with status:${status} phishing: ${isPhishing} isVerified: ${isVerified}`,
                orgId,
                entityId: id,
                entityType: "url"
            });

            res.status(200).json(updatedUrl);
        } else {
            res.status(404).json({ error: 'Url not found' });
        }
    } catch (error) {
        res.status(400).send(error.message);
        console.error(error.message);
    }
});

// Delete a URL
export const deleteUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const orgId = req.user.orgId;
        const urlData = await Url.findById(id);
        if (!urlData) {
            return res.status(404).json({ message: "url not found" });
        }
        await Url.findByIdAndDelete(id);
        const io = req.app.get("socketio");
        io.emit("urlDeleted", id);

        // Add Log entry
        await AdminLogs.create({
            userId,
            operationType: "delete",
            operationsPerformed: `Deleted URL ID: ${id}`,
            orgId,
            entityId: id,
            entityType: "url",
            entityDetails: { identifier: urlData.url, status: urlData.status, extraInfo: `Category: ${urlData.category}` }
        });

        res.status(200).json(id);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Add URLs from a CSV file
export const addUrlFromCsv = asyncHandler(async (req, res) => {
    const filePath = req.file.path;
    const urls = [];
    const errors = [];
    const userId = req.user.userId;
    const orgId = req.user.orgId;

    const { urlHeader, categoryHeader, status, isPhishing, isVerified } = req.body;

    try {
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
                        return;
                    }

                    // Normalize the URL before saving
                    const normalizedUrl = normalizeUrl(url);

                    const urlEntry = {
                        url: normalizedUrl, category, status, isPhishing, isVerified, orgId
                    };

                    urls.push(urlEntry);
                    existingUrls.add(url);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        if (urls.length > 0) {
            const insertedUrls = await Url.insertMany(urls);
            const io = req.app.get("socketio");
            io.emit("urlsByCsvAdded", insertedUrls);

            // Add Log entry
            await AdminLogs.create({
                userId,
                operationType: "add",
                operationsPerformed: `Added Urls Via CSV`,
                orgId
            });

            res.status(200).json({ message: "URLs added successfully" });
        } else {
            res.status(400).json({ message: 'No valid URLs to add or all URLs are duplicates' });
        }
    } catch (error) {
        console.error('Error adding URLs from CSV:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// Controller to get all blacklisted URLs
export const getBlacklistedUrls = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;  // Assuming the orgId is passed with the user object

        // Find URLs that are blacklisted in the database for the given orgId
        const blacklistedUrls = await Url.find({ orgId, status: 'blacklisted' });

        // Extract the 'url' field from the URLs that are blacklisted
        const urls = blacklistedUrls.map((urlEntry) => urlEntry.url);

        // Send the list of blacklisted URLs as response
        res.status(200).json({ urls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export const fetchUrl = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;
        const { url } = req.query;
        const normalizedUrl = normalizeUrl(url);
        const urlData = await Url.findOne({ url: normalizedUrl, orgId });
        if (!urlData) {
            res.status(400).json({ error: "Url does not exists in db" });
        } else {
            res.status(200).json({ urlData });
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}) 