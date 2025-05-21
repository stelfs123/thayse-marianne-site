const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middleware/auth');

// Todas as rotas do cliente requerem autenticação
router.use(authMiddleware.verifyToken);

// Rotas de perfil do cliente
router.get('/profile', clientController.getProfile);
router.put('/profile', clientController.updateProfile);

// Rotas de agendamento
router.get('/services', clientController.getServices);
router.get('/availability', clientController.checkAvailability);
router.post('/appointments', clientController.createAppointment);
router.get('/appointments', clientController.getAppointments);
router.get('/appointments/:id', clientController.getAppointmentDetails);
router.put('/appointments/:id/cancel', clientController.cancelAppointment);

// Rotas de planos e assinaturas
router.get('/plans/available', clientController.getAvailablePlans);
router.get('/subscription', clientController.getSubscription);

// Rotas de avaliações
router.get('/reviews', clientController.getClientReviews);
router.post('/reviews', clientController.createReview);
router.put('/reviews/:id', clientController.updateReview);
router.delete('/reviews/:id', clientController.deleteReview);

module.exports = router;
