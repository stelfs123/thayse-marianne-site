const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

// Rotas públicas (sem autenticação)
router.get('/public', reviewController.getPublicReviews);

// Rotas que requerem autenticação
router.use(authMiddleware.verifyToken);

// Rotas para clientes
router.post('/', reviewController.createReview);
router.get('/my-reviews', reviewController.getClientReviews);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

// Rotas para admin (com verificação de permissão)
router.get('/all', authMiddleware.isAdmin, reviewController.getAllReviews);
router.put('/:id/approve', authMiddleware.isAdmin, reviewController.approveReview);
router.put('/:id/reject', authMiddleware.isAdmin, reviewController.rejectReview);

module.exports = router;
