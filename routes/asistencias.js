const express = require('express');
const router = express.Router();

const { 
  getAsistencias, 
  getFechasAsistencia, 
  getCursosDisponibles, 
  getGradosDisponibles,
  getNivelesDisponibles,
  getResumenAsistencias,
  getAlumnosCriticos
} = require('../controllers/asistenciasController');

// === RUTAS GET ===
router.get('/', getAsistencias);
router.get('/fechas', getFechasAsistencia);
router.get('/cursos', getCursosDisponibles);
router.get('/grados', getGradosDisponibles);
router.get('/niveles', getNivelesDisponibles);
router.get('/resumen', getResumenAsistencias);
router.get('/alumnos-criticos', getAlumnosCriticos);

module.exports = router;