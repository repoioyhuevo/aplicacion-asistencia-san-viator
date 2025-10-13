// routes/index.js
const express = require('express');
const router = express.Router();

const roleController = require('../controllers/roleController');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const dataController = require('../controllers/dataController');

// RUTA INICIAL - Selección de rol
router.get('/', roleController.showRole);

// LOGIN
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// DASHBOARDS
router.get('/dashboard-alumno', dashboardController.showAlumno);
router.get('/dashboard-docente', dashboardController.showDocente);

// API auxiliares
router.get('/api/estudiantes', dataController.getEstudiantes);
router.get('/api/asistencias', dataController.getAsistencias);

module.exports = router;
