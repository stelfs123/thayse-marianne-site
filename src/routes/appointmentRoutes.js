const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');

// Todas as rotas de agendamento requerem autenticação
router.use(authMiddleware.verifyToken);

// Rotas públicas de agendamento (para clientes e admin)
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

// Rotas específicas
router.get('/date/:date', appointmentController.getAppointmentsByDate);
router.get('/client/:clientId', appointmentController.getAppointmentsByClient);
router.put('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
