const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// === RUTAS EXISTENTES ===
router.post('/uploadExcelMulti', upload.single('file'), adminController.uploadExcelMultiHoja);
router.get('/cursos', adminController.getCursos);

// === NUEVAS RUTAS DE GESTIÓN ===

// ========== RUTAS DOCENTES ==========
router.get('/docentes', adminController.getDocentes);
router.post('/docentes', adminController.crearDocente);
router.put('/docentes/:id', adminController.actualizarDocente);
router.delete('/docentes/:id', adminController.eliminarDocente);

// ========== RUTAS ALUMNOS ==========
router.get('/alumnos', adminController.getAlumnos);
router.post('/alumnos', adminController.crearAlumno);
router.put('/alumnos/:id', adminController.actualizarAlumno);
router.delete('/alumnos/:id', adminController.eliminarAlumno);

// ========== RUTAS BLOQUEOS ==========
router.get('/bloqueos', adminController.getBloqueos);
router.post('/bloqueos', adminController.crearBloqueo);
router.delete('/bloqueos/:id', adminController.eliminarBloqueo);

module.exports = router;