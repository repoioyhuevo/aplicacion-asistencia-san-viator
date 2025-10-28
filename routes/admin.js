const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const adminController = require('../controllers/adminController');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // crea la carpeta "uploads" si no existe
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// === RUTAS ===

// Subida de Excel
router.post('/uploadExcelMulti', upload.single('file'), adminController.uploadExcelMultiHoja);

// Obtener cursos
router.get('/cursos', adminController.getCursos);

module.exports = router;