// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');

// Importar rutas
const routes = require('./routes/index');
const asistenciasRoutes = require('./routes/asistencias');
const asistenciasDashboardRoutes = require('./routes/asistencias-dashboard'); // 🔹 NUEVA RUTA

const app = express();

// === CONFIGURACIÓN DE VISTAS ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === MIDDLEWARES ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === SESIONES ===
app.use(session({
  secret: 'claveSecreta123', // ⚠️ cambia esto en producción
  resave: false,
  saveUninitialized: false
}));

// === RUTAS ===
app.use('/', routes);
app.use('/api', asistenciasRoutes);
app.use('/api', asistenciasDashboardRoutes); // 🔹 agrega el nuevo endpoint

// === INICIAR SERVIDOR ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
});
