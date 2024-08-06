const Url = require("../models/urlModel");

const addUrlExt = async (req, res) => {
    try{
        const {url, visitedBy, orgId, isVerified, isPhishing, isUserAdded, tags} = req.body;

        const existingUrl = await Url.findOne({url: url, orgId: orgId});

        if (existingUrl){
            let visitor = existingUrl.visitedBy.find(v => v.userId.equals(visitedBy[0].userId));
            if(visitor){
                visitor.visits.push({timestamp:new Date()})
                visitor.totalVisits += 1;
            } else {
                existingUrl.visitedBy.push({
                    userId: visitedBy[0].userId,
                    username: visitedBy[0].username,
                    visits: [{ timestamp: new Date() }],
                    totalVisits: 1
                });
            }
            await existingUrl.save();
            res.status(200).send(existingUrl);
        } else {
            const newUrl = new Url({
                url: url,
                visitedBy:[{
                    userId: visitedBy[0].userId,
                    username: visitedBy[0].username,
                    visits:[{timestamp: new Date()}],
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
    } catch(error) {
        res.status(400).send(error.message);
    }
}

const fetchUrlStatsExt = async (req, res) => {
    const {username, orgId} = req.query;
    try{
        const result = await Url.aggregate([
            {$match: {"orgId":parseInt(orgId)}},
            {$unwind: "$visitedBy"},
            {$match: {"visitedBy.username": username}},
            {$group: {
                _id: "$isBlacklisted",
                totalVisits:{$sum:"$visitedBy.totalVisits"}
            }}
        ]);

        let response = {
            blacklistedUrls: 0,
            visitedUrls: 0,
        };
        result.forEach(item => {
            if(item._id){
                response.blacklistedUrls = item.totalVisits;
            } else {
                response.visitedUrls = item.totalVisits;
            }
        });
        res.status(200).send(response);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {addUrlExt, fetchUrlStatsExt};