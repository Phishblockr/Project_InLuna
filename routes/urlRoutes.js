const express = require("express");
const router = express.Router();
const {addUrlExt, fetchUrlStatsExt} = require("../controllers/urlController");

router.route("/addUrlExt").post(addUrlExt);
router.route("/urlStatsExt").get(fetchUrlStatsExt);

module.exports = router;