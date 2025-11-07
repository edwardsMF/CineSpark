import { Router } from 'express';
import * as controller from '../controllers/tickets.controller.js';

const router = Router();

router.post('/crear', controller.createTicket);
router.get('/usuario/:id', controller.getUserTickets);
router.get('/:id', controller.getTicketById);
router.post('/:id/mensaje', controller.addMessage);
router.get('/admin/all', controller.getAllTickets);

export default router;

