const Url = require("../models/urlModel");

const addUrl = async (req, res) => {
    try{
        const {url, visitedBy, orgId, isVerified, isPhishing } = req.body;

        const existingUrl = await Url.findOne({url: url, orgId: orgId});

        if (existingUrl){
            let visitor = existingUrl.visitedBy.find(v => v.username === visitedBy[0].username);
            if(visitor){
                visitor.visits.push({timestamp:new Date()})
                visitor.totalVisits += 1;
            } else {
                visitedBy[0].visits = [{timestamp: new Date()}];
                existingUrl.visitedBy.push(visitedBy[0]);
            }
            await existingUrl.save();
            res.status(200).send(existingUrl);
        } else {
            const newUrl = new Url({
                url: url,
                visitedBy:[{
                    username: visitedBy[0].username,
                    visits:[{timestamp: new Date()}],
                    totalVisits: 1,
                }],
                isVerified: isVerified,
                isPhishing: isPhishing,
                orgId: orgId
            });
            await newUrl.save();
            res.status(201).send(newUrl);
        }
    } catch(error) {
        res.status(400).send(error.message);
    }
}

module.exports = {addUrl};