import { Router } from 'express';
import * as controller from '../controllers/rentals.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
router.get('/check/:id', requireAuth, controller.checkRental);
router.post('/:id/cancel', requireAuth, controller.cancel);
router.post('/:id/extend', requireAuth, controller.extend);

export default router;

