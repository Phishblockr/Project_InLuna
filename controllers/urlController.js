import Url from '../models/urlModel.js';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import asyncHandler from '../middlewares/asyncHandler.js';

export const addUrlExt = async (req, res) => {
    try {
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

        const visitedBy = [{ userId }]

        const { url, isVerified, isPhishing, isUserAdded, category } = req.body;

        const existingUrl = await Url.findOne({ url: url, orgId: orgId });

        if (existingUrl) {
            let visitor = existingUrl.visitedBy.find(v => v.userId.equals(visitedBy[0].userId));
            if (visitor) {
                visitor.visits.push({ timestamp: new Date() });
                visitor.totalVisits += 1;
            } else {
                existingUrl.visitedBy.push({
                    userId: visitedBy[0].userId,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                });
            }
            await existingUrl.save();
            res.status(200).send(existingUrl);
        } else {
            const newUrl = new Url({
                url: url,
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

export const unshortenUrl = async (req, res) => {
    const shortUrl = req.query.url;
    if (!shortUrl) {
        return res.status(400).json({ error: 'No URL provided' });
    }
    try {
        const response = await fetch(shortUrl, {
            method: "HEAD",
            redirect: "manual"
        });
        if (response.status === 301 || response.status === 302) {
            const expandedUrl = response.headers.get("Location");
            return res.json({ requested_url: shortUrl, resolved_url: expandedUrl, success: true });
        } else {
            return res.json({ request_url: shortUrl, resolved_url: shortUrl, success: false });
        }
    } catch (error) {
        console.log("Error expanding URL: ", error);
        return res.status(500).json({ error: "Failed to expand URL" });
    }
};

// Dashboard APIs
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
        $or: [
            { status: { $regex: status, $options: "i" } }
        ]
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

export const addUrl = asyncHandler(async (req, res) => {
    try {
        const orgId = req.user.orgId;
        const { url, isVerified, isPhishing, category, status } = req.body;
        const existingUrl = await Url.findOne({ url: url, orgId: orgId });
        if (existingUrl) {
            res.status(400).json({ error: "Url already exists" })
        } else {
            const newUrl = new Url({
                url,
                category,
                isVerified,
                isPhishing,
                status,
                isUserAdded: true,
                orgId
            });
            await newUrl.save();
            const io = req.app.get("socketio");
            io.emit("urlAdded", newUrl);
            res.status(201).send(newUrl);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
})

export const updateUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        let { url, category, status, isPhishing, isVerified } = req.body;
        const updates = {
            url,
            category,
            status,
            isPhishing,
            isVerified,
        }
        const updatedUrl = await Url.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (updatedUrl) {
            const io = req.app.get("socketio");
            io.emit("urlUpdated", updatedUrl);
            res.status(200).json(updatedUrl);
        } else {
            res.status(404).json({ error: 'Url not found' });
        }
    } catch (error) {
        res.status(400).send(error.message);
        console.log(error.message)
    }
});

export const deleteUrl = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const urlData = await Url.findByIdAndDelete(id);
        const io = req.app.get("socketio");
        io.emit("urlDeleted", id);
        res.status(200).json(id);
    } catch (error) {
        res.status(400).send(error.message);
    }
})
