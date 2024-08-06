const express = require("express");
const router = express.Router();
const {addWhitelistReqExt} = require("../controllers/whitelistReqController");

router.route("/addWhitelistReqExt").post(addWhitelistReqExt);

module.exports = router;