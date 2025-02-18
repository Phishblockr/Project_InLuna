import express from 'express';
import {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
} from '../controllers/organizationController.js';

const router = express.Router();

router.get('/all', getAllOrganizations);
router.post('/', createOrganization);
router.get('/search', searchOrganizations);
router.get('/:id', getOrganization);
router.delete('/:id', deleteOrganization);
router.put('/:id', updateOrganization);

export default router;
