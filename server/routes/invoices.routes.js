import { Router } from 'express';
import * as controller from '../controllers/invoices.controller.js';

const router = Router();

router.get('/:userId', controller.listUserInvoices);

export default router;

