import { Router } from 'express';
import * as moviesController from '../controllers/movies.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/', moviesController.list);
router.get('/:id', moviesController.getById);

// Rutas protegidas (requieren autenticación y rol admin)
router.post('/', requireAuth, requireAdmin, moviesController.create);
router.put('/:id', requireAuth, requireAdmin, moviesController.update);
router.delete('/:id', requireAuth, requireAdmin, moviesController.remove);

export default router;

