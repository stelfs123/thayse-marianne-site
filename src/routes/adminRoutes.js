const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Todas as rotas de admin requerem autenticação e permissão de admin
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isAdmin);

// Rotas de dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Rotas de gerenciamento de clientes
router.get('/clients', adminController.getAllClients);
router.get('/clients/:id', adminController.getClientDetails);
router.put('/clients/:id', adminController.updateClient);
router.delete('/clients/:id', adminController.deleteClient);

// Rotas de gerenciamento de planos
router.get('/plans', adminController.getAllPlans);
router.post('/plans', adminController.createPlan);
router.put('/plans/:id', adminController.updatePlan);
router.delete('/plans/:id', adminController.deletePlan);

// Rotas de gerenciamento de assinaturas
router.get('/subscriptions', adminController.getAllSubscriptions);
router.post('/subscriptions', adminController.createSubscription);
router.put('/subscriptions/:id', adminController.updateSubscription);
router.delete('/subscriptions/:id', adminController.deleteSubscription);

// Rotas de gerenciamento de serviços
router.get('/services', adminController.getAllServices);
router.post('/services', adminController.createService);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Rotas de gerenciamento de agendamentos
router.get('/appointments', adminController.getAllAppointments);
router.get('/appointments/:id', adminController.getAppointmentDetails);
router.put('/appointments/:id', adminController.updateAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Rotas de gerenciamento de disponibilidade
router.get('/availability', adminController.getAvailability);
router.post('/availability', adminController.setAvailability);
router.post('/availability/exception', adminController.addAvailabilityException);
router.delete('/availability/exception/:id', adminController.deleteAvailabilityException);

// Rotas de gerenciamento de avaliações
router.get('/reviews', adminController.getAllReviews);
router.put('/reviews/:id/approve', adminController.approveReview);
router.put('/reviews/:id/reject', adminController.rejectReview);
router.delete('/reviews/:id', adminController.deleteReview);

// Rotas de configurações do site
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
