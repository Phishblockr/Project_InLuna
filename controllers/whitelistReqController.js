const whitelistReq = require("../models/whitelistReqModel");

const addWhitelistReqExt = async (req, res) => {
    try{
        const {userProfileImg, userId, username, url, reason, orgId} = req.body;
        const newWhitelistReq = new whitelistReq({
            userProfileImg,
            userId,
            username,
            url,
            reason,
            orgId,
        });
        await newWhitelistReq.save();
        res.status(201).send(newWhitelistReq);
    } catch (error){
        res.status(400).send(error.message);
    }
}

module.exports = {addWhitelistReqExt};