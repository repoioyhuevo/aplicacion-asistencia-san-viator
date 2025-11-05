const express = require('express');
const router = express.Router();

const { 
  getAsistencias, 
  getFechasAsistencia, 
  getCursosDisponibles, 
  getGradosDisponibles,
  getNivelesDisponibles,
  getResumenAsistencias,
  getAlumnosCriticos,
  getBloqueosDelDia  // ✅ AGREGAR ESTA IMPORTACIÓN
} = require('../controllers/asistenciasController');

// === RUTAS GET ===
router.get('/', getAsistencias);
router.get('/fechas', getFechasAsistencia);
router.get('/cursos', getCursosDisponibles);
router.get('/grados', getGradosDisponibles);
router.get('/niveles', getNivelesDisponibles);
router.get('/resumen', getResumenAsistencias);
router.get('/alumnos-criticos', getAlumnosCriticos);
router.get('/bloqueos-del-dia', getBloqueosDelDia); // ✅ AGREGAR ESTA RUTA NUEVA

module.exports = router;