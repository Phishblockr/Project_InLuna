import express from 'express';
import {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrganizationsByAdmin,
  aggregateStatistics,
  findUsersWithOrgId
} from '../controllers/organizationController.js';

const router = express.Router();

router.get('/all', getAllOrganizations);
router.post('/', createOrganization);
router.get('/search', searchOrganizations);
router.get('/admin/:adminName', getOrganizationsByAdmin);
router.get('/stats/aggregate', aggregateStatistics);
router.get('/:id', getOrganization);
router.delete('/:id', deleteOrganization);
router.put('/:id', updateOrganization);
router.get('/getAllUsers/:orgId', findUsersWithOrgId);

export default router;
