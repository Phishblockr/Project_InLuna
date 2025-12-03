// routes/oidcRoutes.js

import express from "express";
import {
  getInteraction,
  postInteractionLogin,
} from "../controllers/oidcController.js";

const router = express.Router();

export default function (provider) {
  /**
   * @openapi
   * /oidc/interaction/{uid}:
   *   get:
   *     summary: Retrieve OIDC interaction details for a given UID
   *     tags:
   *       - OIDC
   *     parameters:
   *       - in: path
   *         name: uid
   *         required: true
   *         schema:
   *           type: string
   *         description: Interaction UID provided by the OIDC provider
   *     responses:
   *       '200':
   *         description: Interaction details (HTML or JSON depending on integration)
   *       '404':
   *         description: Interaction not found
   */
  router.get("/interaction/:uid", getInteraction);

  /**
   * @openapi
   * /oidc/interaction/{uid}/login:
   *   post:
   *     summary: Handle login form submission for an OIDC interaction
   *     tags:
   *       - OIDC
   *     parameters:
   *       - in: path
   *         name: uid
   *         required: true
   *         schema:
   *           type: string
   *         description: Interaction UID
   *     requestBody:
   *       required: true
   *       content:
   *         application/x-www-form-urlencoded:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       '302':
   *         description: Redirect after successful interaction handling
   *       '400':
   *         description: Invalid input or failed authentication
   */
  router.post("/interaction/:uid/login", (req, res, next) => {
    postInteractionLogin(req, res, next, provider);
  });

  return router;
}
