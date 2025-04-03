import express from 'express';
import {
  getAllOrganizations,
  createOrganization,
  getOrganization,
  deleteOrganization,
  updateOrganization,
  searchOrganizations,
  getOrgDetails,
} from '../controllers/organizationController.js';

const router = express.Router();

router.get('/all', getAllOrganizations);
router.post('/create', createOrganization);
router.get('/search', searchOrganizations);
router.get('/get/:id', getOrganization);
router.delete('/delete/:id', deleteOrganization);
router.put('/update/:id', updateOrganization);

router.get("/orgDetails/:id", getOrgDetails);

export default router;
