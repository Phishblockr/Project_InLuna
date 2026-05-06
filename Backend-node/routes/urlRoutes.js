import express from "express";
import {
  addUrlExt,
  fetchUrlStatsExt,
  getBlacklistedUrls,
  unshortenUrl,
  getUrls,
  addUrl,
  updateUrl,
  deleteUrl,
  addUrlFromCsv,
  fetchUrl,
} from "../controllers/urlController.js";
import { convertTypes } from "../middlewares/convertTypes.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @openapi
 * /api/url/addUrlExt:
 *   post:
 *     tags:
 *       - URL
 *     summary: Add a URL (external flow)
 *     description: Adds a URL using the external API flow. Requires authentication.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: URL added
 *       400:
 *         description: Bad request
 */
router.route("/addUrlExt").post(addUrlExt);

/**
 * @openapi
 * /api/url/urlStatsExt:
 *   get:
 *     tags:
 *       - URL
 *     summary: Fetch URL statistics (external)
 *     description: Returns aggregated statistics for a URL via the external stats endpoint.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - name: shortId
 *         in: query
 *         schema:
 *           type: string
 *         description: Short URL identifier
 *     responses:
 *       200:
 *         description: Statistics object
 *       400:
 *         description: Bad request
 */
router.route("/urlStatsExt").get(fetchUrlStatsExt);

/**
 * @openapi
 * /api/url/unshortenUrl:
 *   get:
 *     tags:
 *       - URL
 *     summary: Unshorten a short URL
 *     description: Resolves a short URL to its final destination.
 *     parameters:
 *       - name: shortUrl
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Final destination URL
 *       400:
 *         description: Bad request
 */
router.route("/unshortenUrl").get(unshortenUrl);

/**
 * @openapi
 * /api/url/getUrls:
 *   get:
 *     tags:
 *       - URL
 *     summary: Get URLs (paginated)
 *     description: Returns a paginated list of URLs.
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of URL objects
 */
router.route("/getUrls").get(getUrls);

/**
 * @openapi
 * /api/url/addUrl:
 *   post:
 *     tags:
 *       - URL
 *     summary: Add or create a URL
 *     description: Add a URL with optional flags. Requires authentication.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               originalUrl:
 *                 type: string
 *               isPhishing:
 *                 type: boolean
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: URL created
 *       400:
 *         description: Bad request
 */
router
  .route("/addUrl")
  .post(convertTypes(["isPhishing", "isVerified"]), addUrl);

/**
 * @openapi
 * /api/url/updateUrl/{id}:
 *   put:
 *     tags:
 *       - URL
 *     summary: Update URL by id
 *     description: Update URL fields by id. Requires authentication.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPhishing:
 *                 type: boolean
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: URL updated
 *       400:
 *         description: Bad request
 */
router
  .route("/updateUrl/:id")
  .put(convertTypes(["isPhishing", "isVerified"]), updateUrl);

/**
 * @openapi
 * /api/url/deleteUrl/{id}:
 *   delete:
 *     tags:
 *       - URL
 *     summary: Delete URL by id
 *     description: Delete a URL by id. Requires authentication.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL deleted
 *       401:
 *         description: Unauthorized
 */
router.route("/deleteUrl/:id").delete(deleteUrl);

/**
 * @openapi
 * /api/url/addUrlFromCsv:
 *   post:
 *     tags:
 *       - URL
 *     summary: Bulk add URLs from CSV
 *     description: Upload a CSV file to add multiple URLs. Requires authentication and multipart/form-data upload with field name `file`.
 *     parameters:
 *       - name: Authorization
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: URLs imported
 *       400:
 *         description: Bad request
 */
router.post("/addUrlFromCsv", upload.single("file"), addUrlFromCsv);

/**
 * @openapi
 * /api/url/getBlacklistedUrls:
 *   get:
 *     tags:
 *       - URL
 *     summary: Get blacklisted URLs
 *     description: Returns a list of blacklisted URLs.
 *     responses:
 *       200:
 *         description: Array of blacklisted URLs
 */
router.route("/getBlacklistedUrls").get(getBlacklistedUrls);

/**
 * @openapi
 * /api/url/fetchUrl:
 *   get:
 *     tags:
 *       - URL
 *     summary: Fetch URL details
 *     description: Fetch detailed information for a given URL.
 *     parameters:
 *       - name: url
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL details returned
 *       404:
 *         description: Not found
 */
router.route("/fetchUrl").get(fetchUrl);

export default router;
