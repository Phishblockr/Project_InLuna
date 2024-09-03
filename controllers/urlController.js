import Url from '../models/urlModel.js';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

export const addUrlExt = async (req, res) => {
    try {
        
        const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);
        const orgId = req.user.orgId;

        const visitedBy =  [{ userId }]

        const { url, isVerified, isPhishing, isUserAdded, tags } = req.body;

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
                tags: tags,
                isVerified: isVerified,
                isPhishing: isPhishing,
                isUserAdded: isUserAdded,
                orgId: orgId
            });
            await newUrl.save();
            res.status(201).send(newUrl);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const fetchUrlStatsExt = async (req, res) => {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.user.userId);  
    const orgId = req.user.orgId;

    console.log(userId, orgId);
    try {
        const result = await Url.aggregate([
            { $match: { orgId: orgId } },  
            { $unwind: "$visitedBy" },  
            { $match: { "visitedBy.userId": userId } },  
            { $group: {
                _id: "$isBlacklisted",  
                totalVisits: { $sum: "$visitedBy.totalVisits" }  
            }}
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
