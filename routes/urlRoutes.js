const express = require("express");
const router = express.Router();
const {addUrl} = require("../controllers/urlController");

router.route("/addUrl").post(addUrl)

module.exports = router;