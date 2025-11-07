import { Router } from 'express';
import * as tmdbController from '../controllers/tmdb.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Rutas públicas para explorar TMDb (sin agregar al sistema)
router.get('/movies/popular', tmdbController.getPopularMovies);
router.get('/tv/popular', tmdbController.getPopularTVShows);
router.get('/movies/search', tmdbController.searchMovies);
router.get('/tv/search', tmdbController.searchTVShows);

// Rutas protegidas para poblar datos (requieren autenticación)
// Solo administradores pueden poblar datos masivamente
router.post('/populate/movies', requireAuth, requireAdmin, tmdbController.populateMovies);
router.post('/populate/tv', requireAuth, requireAdmin, tmdbController.populateTVShows);
router.post('/add/movie', requireAuth, requireAdmin, tmdbController.addMovieFromTMDB);
router.post('/add/tv', requireAuth, requireAdmin, tmdbController.addTVShowFromTMDB);

export default router;





