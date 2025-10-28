// controllers/barcodeController.js
const db = require('../models/db');

exports.registrarAsistenciaPorBarcode = async (req, res) => {
  try {
    const { codigoBarras } = req.body;

    if (!codigoBarras) {
      return res.status(400).json({
        success: false,
        message: 'Código de barras requerido'
      });
    }

    // Buscar estudiante por RUT
    const rutLimpio = codigoBarras.replace(/[\.\-]/g, '');
    
    const [estudiantes] = await db.query(
      `SELECT id, run, nombres, apellido_paterno, apellido_materno 
       FROM estudiantes2 
       WHERE REPLACE(REPLACE(run, '.', ''), '-', '') = ?`,
      [rutLimpio]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const estudiante = estudiantes[0];
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 8);

    // VERIFICAR SI YA EXISTE REGISTRO (AUSENTE O PRESENTE)
    const [registrosHoy] = await db.query(
      `SELECT id_asistencia, presente, tipo_registro FROM asistencias 
       WHERE id_estudiante = ? AND DATE(fecha) = ?`,
      [estudiante.id, fecha]
    );

    // Si ya está marcado como PRESENTE por ESCANEO (no por automático)
    if (registrosHoy.length > 0 && registrosHoy[0].presente === 1 && 
        registrosHoy[0].tipo_registro !== 'falta_automatica') {
      return res.json({
        success: true,
        message: 'Asistencia ya registrada hoy',
        estudiante: {
          nombre: `${estudiante.nombres} ${estudiante.apellido_paterno}`,
          run: estudiante.run
        },
        yaRegistrado: true
      });
    }

    // Si existe registro automático (ausente), ACTUALIZAR a presente por escaneo
    if (registrosHoy.length > 0 && registrosHoy[0].presente === 0 && 
        registrosHoy[0].tipo_registro === 'falta_automatica') {
      await db.query(
        `UPDATE asistencias 
         SET presente = 1, hora = ?, tipo_registro = 'entrada_escaneo'
         WHERE id_asistencia = ?`,
        [hora, registrosHoy[0].id_asistencia]
      );

      return res.json({
        success: true,
        message: 'Asistencia registrada exitosamente',
        estudiante: {
          nombre: `${estudiante.nombres} ${estudiante.apellido_paterno}`,
          run: estudiante.run
        },
        actualizado: true
      });
    }

    // Si no existe registro, INSERTAR NUEVO como presente por escaneo
    await db.query(
      `INSERT INTO asistencias 
       (id_estudiante, fecha, hora, tipo_registro, presente) 
       VALUES (?, ?, ?, 'entrada_escaneo', 1)`,
      [estudiante.id, fecha, hora]
    );

    res.json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      estudiante: {
        nombre: `${estudiante.nombres} ${estudiante.apellido_paterno}`,
        run: estudiante.run
      }
    });

  } catch (err) {
    console.error('Error en registrarAsistenciaPorBarcode:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener registros del día actual (SOLO LOS REALES, NO AUTOMÁTICOS)
exports.getRegistrosHoy = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    const [registros] = await db.query(`
      SELECT 
        a.id_asistencia,
        e.run,
        CONCAT(e.nombres, ' ', e.apellido_paterno, ' ', e.apellido_materno) as nombre_completo,
        a.hora,
        a.presente,
        a.tipo_registro,
        c.descripcion as curso
      FROM asistencias a
      INNER JOIN estudiantes2 e ON a.id_estudiante = e.id
      INNER JOIN cursos c ON e.curso_id = c.id
      WHERE DATE(a.fecha) = ? 
      AND a.tipo_registro != 'falta_automatica'  -- EXCLUIR REGISTROS AUTOMÁTICOS
      ORDER BY a.hora DESC
      LIMIT 100
    `, [hoy]);

    res.json({
      success: true,
      registros: registros,
      total: registros.length
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros del día'
    });
  }
};

exports.mostrarScanner = (req, res) => {
  res.render('scanner-simple');
};