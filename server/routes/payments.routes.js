import { Router } from 'express';
import * as controller from '../controllers/payments.controller.js';

const router = Router();

router.post('/alquiler', controller.payRental);
router.post('/suscripcion', controller.paySubscription);
router.get('/:userId', controller.listUserPayments);

export default router;

