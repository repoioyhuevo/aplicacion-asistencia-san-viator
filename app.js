// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');
const barcodeController = require('./controllers/barcodeController');

const app = express();

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sesiones
app.use(session({
  secret: 'secreto-sanviator-2025',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rutas
app.use('/api/barcode', require('./routes/barcode'));
app.use('/', require('./routes/index'));
app.use('/api/asistencias', require('./routes/asistencias'));
app.use('/admin', require('./routes/admin'));

// RUTAS DEL ESCÁNER
app.get('/scanner', barcodeController.mostrarScanner);
app.post('/api/barcode/registrar-asistencia', barcodeController.registrarAsistenciaPorBarcode);

// RUTA ACTUALIZADA: Para que el alumno verifique sus registros (CON PRESENTE)
app.get('/api/alumno/ultimo-registro/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const hoy = new Date().toISOString().split('T')[0];
    
    // Buscar el último registro del día para este RUT
    const [registros] = await db.query(
      `SELECT a.*, e.nombres, e.apellido_paterno 
       FROM asistencias a 
       JOIN estudiantes2 e ON a.id_estudiante = e.id 
       WHERE e.run = ? AND DATE(a.fecha) = ? 
       ORDER BY a.hora DESC LIMIT 1`,
      [rut, hoy]
    );
    
    if (registros.length > 0) {
      res.json({
        tieneRegistro: true,
        ultimoRegistro: {
          hora: registros[0].hora,
          fecha: registros[0].fecha,
          nombre: `${registros[0].nombres} ${registros[0].apellido_paterno}`,
          id_asistencia: registros[0].id_asistencia,
          presente: registros[0].presente, // ← ESTE ES EL CAMPO QUE FALTABA
          tipo_registro: registros[0].tipo_registro // ← Y ESTE TAMBIÉN
        }
      });
    } else {
      res.json({ tieneRegistro: false });
    }
  } catch (error) {
    console.error('Error en /api/alumno/ultimo-registro:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// INICIAR PROGRAMADOR DIARIO DE ASISTENCIAS
function iniciarProgramadorDiario() {
  try {
    const dailyAttendanceController = require('./controllers/dailyAttendanceController');
    dailyAttendanceController.iniciarProgramadorDiario();
    console.log('✅ Programador diario de faltas automáticas ACTIVADO');
  } catch (error) {
    console.log('⚠️ dailyAttendanceController no encontrado, continuando sin programador...');
    console.log('💡 Para activar el registro automático de faltas:');
    console.log('   1. Crea el archivo controllers/dailyAttendanceController.js');
    console.log('   2. Ejecuta: npm install node-cron');
  }
}

// Prueba de conexión a la base de datos
async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Conexión a BD exitosa');
    
    // Verificar tablas existentes
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📊 Tablas en la BD:', tableNames);
    
    // Verificar datos en usuarios_docentes
    const [users] = await db.query('SELECT * FROM usuarios_docentes');
    console.log(`👥 Usuarios docentes: ${users.length}`);
    
    // Verificar datos en estudiantes
    const [students] = await db.query('SELECT COUNT(*) as total FROM estudiantes2');
    console.log(`👨‍🎓 Estudiantes: ${students[0].total}`);
    
    // Verificar datos en asistencias
    const [attendances] = await db.query('SELECT COUNT(*) as total FROM asistencias');
    console.log(`📝 Registros de asistencia: ${attendances[0].total}`);
    
    // Verificar estudiantes excluyendo transición
    const [studentsSinTransicion] = await db.query(`
      SELECT COUNT(*) as total 
      FROM estudiantes2 e
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE c.descripcion NOT LIKE '%Transición%'
    `);
    console.log(`🎯 Estudiantes (sin transición): ${studentsSinTransicion[0].total}`);
    
  } catch (error) {
    console.error('❌ Error de conexión a BD:', error);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor en http://localhost:${PORT}`);
  console.log(`📅 Sistema de asistencia San Viator - EXCLUYENDO NIVELES DE TRANSICIÓN`);
  testConnection();
  iniciarProgramadorDiario();
});