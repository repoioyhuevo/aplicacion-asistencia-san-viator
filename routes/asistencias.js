const express = require("express");
const router = express.Router();
const asistenciasController = require("../controllers/asistenciasController");

router.get("/", asistenciasController.getAsistencias);
router.get("/dashboard", asistenciasController.getAsistenciasDashboard);
router.post("/registrar", asistenciasController.registrarAsistencia);
router.get("/fechas-asistencia", asistenciasController.getFechasValidas);


module.exports = router;
