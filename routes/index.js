// routes/index.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const alumnoController = require('../controllers/alumnoController'); // Cambiado
const dashboardController = require('../controllers/dashboardController');
const dataController = require('../controllers/dataController');

// === LOGIN ===
router.get('/', authController.showLogin);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// === DASHBOARDS ===
router.get('/dashboard-alumno', alumnoController.dashboardAlumno); // Usar alumnoController
router.get('/dashboard-docente', dashboardController.showDocente);

// === API auxiliares (solo estudiantes, no asistencias) ===
router.get('/api/estudiantes', dataController.getEstudiantes);

module.exports = router;