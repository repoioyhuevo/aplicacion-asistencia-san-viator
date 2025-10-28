const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');

// Mostrar página del escáner
router.get('/', barcodeController.mostrarScanner);

// Ruta para registrar asistencia por código de barras
router.post('/registrar-asistencia', barcodeController.registrarAsistenciaPorBarcode);

// NUEVA RUTA: Obtener registros del día actual
router.get('/registros-hoy', barcodeController.getRegistrosHoy);

module.exports = router;