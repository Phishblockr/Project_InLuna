import express from "express";
import {
  getAllCampaigns,
  getCampaignById,
  addCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController.js";

const router = express.Router();

// GET all campaigns
/**
 * @openapi
 * /api/campaign:
 *   get:
 *     summary: Get list of campaigns
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       '200':
 *         description: Array of campaign objects
 */
router.get("/", getAllCampaigns);

// GET a single campaign by ID
/**
 * @openapi
 * /api/campaign/{id}:
 *   get:
 *     summary: Get a campaign by ID
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       '200':
 *         description: Campaign object
 *       '404':
 *         description: Campaign not found
 */
router.get("/:id", getCampaignById);

// POST a new campaign
/**
 * @openapi
 * /api/campaign:
 *   post:
 *     summary: Create a new campaign
 *     tags:
 *       - Campaign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '201':
 *         description: Campaign created
 */
router.post("/", addCampaign);

// PUT update a campaign
/**
 * @openapi
 * /api/campaign/{id}:
 *   put:
 *     summary: Update an existing campaign
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       '200':
 *         description: Campaign updated
 */
router.put("/:id", updateCampaign);

// DELETE a campaign
/**
 * @openapi
 * /api/campaign/{id}:
 *   delete:
 *     summary: Delete a campaign by ID
 *     tags:
 *       - Campaign
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       '200':
 *         description: Campaign deleted
 */
router.delete("/:id", deleteCampaign);

export default router;
