// routes/oidcRoutes.js

import express from 'express';
import { getInteraction, postInteractionLogin } from '../controllers/oidcController.js';

const router = express.Router();

export default function(provider) {
  router.get('/interaction/:uid', getInteraction);

  router.post('/interaction/:uid/login', (req, res, next) => {
    postInteractionLogin(req, res, next, provider);
  });

  return router;
}
