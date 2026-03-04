import express from 'express';
import { registerCow, getMyCattle, getCowProfile, searchCow } from '../controllers/cattle';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(requireAuth);

router.post('/search', searchCow);
router.post('/', registerCow);
router.get('/', getMyCattle);
router.get('/:id', getCowProfile);

export default router;
