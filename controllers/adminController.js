// controllers/adminController.js - VERSIÓN COMPLETA CORREGIDA
const xlsx = require('xlsx');
const db = require('../models/db');
const fs = require('fs');
const path = require('path');

// ========== FUNCIONES EXISTENTES ==========
function normalizarTexto(texto) {
  if (!texto) return '';
  return texto.toString().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/º/g, "°")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function uploadExcelMultiHoja(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No se subió ningún archivo" });
    }

    const filePath = req.file.path;

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, message: "Archivo no encontrado en el servidor" });
    }

    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (excelErr) {
      return res.status(500).json({ success: false, message: "Error al leer archivo Excel", error: excelErr.message });
    }

    let cursosRows;
    try {
      [cursosRows] = await db.query("SELECT id, nivel, letra, descripcion FROM cursos WHERE descripcion NOT LIKE '%Transición%'");
    } catch (dbCursosErr) {
      return res.status(500).json({ success: false, message: "Error al obtener cursos de la base de datos", error: dbCursosErr.message });
    }

    let totalInsertados = 0;
    let errores = [];

    for (const sheetName of workbook.SheetNames) {
      const nombreNormalizado = normalizarTexto(sheetName);

      // EXCLUIR HOJAS DE TRANSICIÓN
      if (nombreNormalizado.includes('transicion') || nombreNormalizado.includes('transición')) {
        console.log(`⏭️ Saltando hoja de transición: ${sheetName}`);
        continue;
      }

      const curso = cursosRows.find(
        c =>
          normalizarTexto(`${c.nivel} ${c.letra}`).includes(nombreNormalizado) ||
          normalizarTexto(c.descripcion).includes(nombreNormalizado)
      );

      if (!curso) {
        errores.push(`Curso no encontrado para hoja: ${sheetName}`);
        continue;
      }

      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      for (const alumno of sheetData) {
        const run = (alumno.RUN || alumno.Run || alumno.run || '').toString().trim();
        const apellido_paterno = (alumno['Apellido paterno'] || alumno.ApellidoPaterno || alumno.apellido_paterno || '').toString().trim();
        const apellido_materno = (alumno['Apellido materno'] || alumno.ApellidoMaterno || alumno.apellido_materno || '').toString().trim();
        const nombres = (alumno.Nombres || alumno.nombres || '').toString().trim();

        if (!run || !nombres) {
          errores.push(`Datos faltantes en hoja "${sheetName}"`);
          continue;
        }

        try {
          await db.query(
            `INSERT INTO estudiantes2 (run, apellido_paterno, apellido_materno, nombres, curso_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             apellido_paterno = VALUES(apellido_paterno),
             apellido_materno = VALUES(apellido_materno),
             nombres = VALUES(nombres),
             curso_id = VALUES(curso_id)`,
            [run, apellido_paterno, apellido_materno, nombres, curso.id]
          );
          totalInsertados++;
        } catch (dbErr) {
          errores.push(`Error DB alumno ${run}: ${dbErr.message}`);
        }
      }
    }

    if (errores.length) {
      return res.status(400).json({
        success: false,
        message: "Se encontraron errores durante la carga",
        errores,
        total: totalInsertados
      });
    }

    res.json({
      success: true,
      message: "Archivo procesado correctamente",
      total: totalInsertados
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error general al procesar el Excel",
      error: err.message
    });
  }
}

async function getCursos(req, res) {
  try {
    const [rows] = await db.query("SELECT id, nivel, letra, descripcion FROM cursos WHERE descripcion NOT LIKE '%Transición%'");
    res.json(rows);
  } catch (err) {
    res.status(500).json([]);
  }
}

// ========== NUEVAS FUNCIONES DE GESTIÓN ==========

// ========== GESTIÓN DE DOCENTES ==========

// Obtener todos los docentes
async function getDocentes(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT id_usuario, nombre_usuario, nombre_completo, correo, rol, activo 
      FROM usuarios_docentes 
      WHERE rol = 'docente'
      ORDER BY nombre_completo
    `);
    res.json({ success: true, docentes: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Crear nuevo docente
async function crearDocente(req, res) {
  try {
    const { nombre_usuario, contraseña, nombre_completo, correo } = req.body;
    
    if (!nombre_usuario || !contraseña || !nombre_completo) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes' });
    }

    await db.query(
      `INSERT INTO usuarios_docentes (nombre_usuario, contraseña, nombre_completo, correo, rol, activo) 
       VALUES (?, ?, ?, ?, 'docente', 1)`,
      [nombre_usuario, contraseña, nombre_completo, correo]
    );

    res.json({ success: true, message: 'Docente creado exitosamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

// Actualizar docente
async function actualizarDocente(req, res) {
  try {
    const { id } = req.params;
    const { nombre_usuario, contraseña, nombre_completo, correo, activo } = req.body;
    
    let query = `UPDATE usuarios_docentes SET nombre_usuario = ?, nombre_completo = ?, correo = ?, activo = ?`;
    let params = [nombre_usuario, nombre_completo, correo, activo];
    
    if (contraseña) {
      query += `, contraseña = ?`;
      params.push(contraseña);
    }
    
    query += ` WHERE id_usuario = ? AND rol = 'docente'`;
    params.push(id);
    
    await db.query(query, params);
    
    res.json({ success: true, message: 'Docente actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Eliminar docente
async function eliminarDocente(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(`DELETE FROM usuarios_docentes WHERE id_usuario = ? AND rol = 'docente'`, [id]);
    
    res.json({ success: true, message: 'Docente eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ========== GESTIÓN DE ALUMNOS ==========

// ✅ CORREGIDO: Obtener alumnos con filtros funcionando
async function getAlumnos(req, res) {
  try {
    const { curso, buscar } = req.query;
    
    console.log(`🔍 Filtros recibidos: curso=${curso}, buscar=${buscar}`);
    
    let whereClause = "WHERE c.descripcion NOT LIKE '%Transición%'";
    const params = [];
    
    // ✅ FILTRO CURSO SIMPLE
    if (curso && curso !== 'todos' && curso !== 'undefined') {
      whereClause += " AND c.id = ?";
      params.push(curso);
      console.log(`🎯 Filtro curso aplicado: ${curso}`);
    }
    
    // ✅ FILTRO BUSCAR
    if (buscar && buscar !== 'undefined') {
      whereClause += " AND (e.run LIKE ? OR e.nombres LIKE ? OR e.apellido_paterno LIKE ? OR e.apellido_materno LIKE ?)";
      const searchTerm = `%${buscar}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      console.log(`🎯 Filtro buscar aplicado: ${buscar}`);
    }
    
    console.log(`📊 Consulta SQL: SELECT... ${whereClause}`);
    console.log(`📊 Parámetros:`, params);
    
    const [rows] = await db.query(`
      SELECT e.id, e.run, e.nombres, e.apellido_paterno, e.apellido_materno, 
             c.id as curso_id, c.descripcion as curso, c.nivel, c.letra,
             e.activo
      FROM estudiantes2 e
      INNER JOIN cursos c ON e.curso_id = c.id
      ${whereClause}
      ORDER BY c.nivel, c.letra, e.apellido_paterno, e.apellido_materno, e.nombres
    `, params);
    
    console.log(`✅ Alumnos encontrados: ${rows.length}`);
    
    res.json({ success: true, alumnos: rows });
  } catch (err) {
    console.error('❌ Error en getAlumnos:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// Actualizar alumno
async function actualizarAlumno(req, res) {
  try {
    const { id } = req.params;
    const { run, nombres, apellido_paterno, apellido_materno, curso_id, activo } = req.body;
    
    await db.query(
      `UPDATE estudiantes2 
       SET run = ?, nombres = ?, apellido_paterno = ?, apellido_materno = ?, curso_id = ?, activo = ?
       WHERE id = ?`,
      [run, nombres, apellido_paterno, apellido_materno, curso_id, activo, id]
    );
    
    res.json({ success: true, message: 'Alumno actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Crear alumno
async function crearAlumno(req, res) {
  try {
    const { run, nombres, apellido_paterno, apellido_materno, curso_id } = req.body;
    
    await db.query(
      `INSERT INTO estudiantes2 (run, nombres, apellido_paterno, apellido_materno, curso_id, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [run, nombres, apellido_paterno, apellido_materno, curso_id]
    );
    
    res.json({ success: true, message: 'Alumno creado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Eliminar alumno
async function eliminarAlumno(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(`DELETE FROM estudiantes2 WHERE id = ?`, [id]);
    
    res.json({ success: true, message: 'Alumno eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ========== GESTIÓN DE BLOQUEOS ==========

// Crear tabla para bloqueos si no existe
async function crearTablaBloqueos() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS blogueos_asistencia (
        id INT PRIMARY KEY AUTO_INCREMENT,
        curso_id INT,
        dia_semana INT COMMENT '0=Domingo, 1=Lunes, ..., 6=Sábado',
        fecha_especifica DATE NULL,
        motivo VARCHAR(255),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
      )
    `);
    console.log('✅ Tabla de bloqueos creada/verificada');
  } catch (err) {
    console.error('❌ Error creando tabla de bloqueos:', err);
  }
}

// Obtener bloqueos
async function getBloqueos(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT b.*, c.descripcion as curso_nombre
      FROM blogueos_asistencia b
      INNER JOIN cursos c ON b.curso_id = c.id
      WHERE b.activo = true
      ORDER BY c.descripcion, b.dia_semana
    `);
    
    res.json({ success: true, bloqueos: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Crear bloqueo
async function crearBloqueo(req, res) {
  try {
    const { curso_id, dia_semana, fecha_especifica, motivo } = req.body;
    
    await db.query(
      `INSERT INTO blogueos_asistencia (curso_id, dia_semana, fecha_especifica, motivo, activo)
       VALUES (?, ?, ?, ?, true)`,
      [curso_id, dia_semana, fecha_especifica, motivo]
    );
    
    res.json({ success: true, message: 'Bloqueo creado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Eliminar bloqueo
async function eliminarBloqueo(req, res) {
  try {
    const { id } = req.params;
    
    await db.query(`UPDATE blogueos_asistencia SET activo = false WHERE id = ?`, [id]);
    
    res.json({ success: true, message: 'Bloqueo eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ✅ FUNCIÓN CORREGIDA: Verificar si un curso está bloqueado para una fecha
async function verificarBloqueo(curso_id, fecha) {
  try {
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    
    // Formatear fecha para comparación
    const fechaStr = fechaObj.toISOString().split('T')[0];
    
    console.log(`🔍 Verificando bloqueo: curso ${curso_id}, fecha ${fechaStr}, día semana ${diaSemana}`);
    
    const [rows] = await db.query(`
      SELECT COUNT(*) as count 
      FROM blogueos_asistencia 
      WHERE curso_id = ? 
        AND activo = true
        AND (
          (dia_semana = ? AND fecha_especifica IS NULL) OR 
          (fecha_especifica = ?)
        )
    `, [curso_id, diaSemana, fechaStr]);
    
    const estaBloqueado = rows[0].count > 0;
    console.log(`📋 Resultado bloqueo: ${estaBloqueado} (${rows[0].count} registros encontrados)`);
    
    return estaBloqueado;
  } catch (err) {
    console.error('❌ Error verificando bloqueo:', err);
    return false;
  }
}

// ========== EXPORTAR TODAS LAS FUNCIONES ==========
module.exports = {
  // Funciones existentes
  uploadExcelMultiHoja,
  getCursos,
  
  // Nuevas funciones de gestión
  getDocentes,
  crearDocente,
  actualizarDocente,
  eliminarDocente,
  
  getAlumnos,
  crearAlumno,
  actualizarAlumno,
  eliminarAlumno,
  
  crearTablaBloqueos,
  getBloqueos,
  crearBloqueo,
  eliminarBloqueo,
  verificarBloqueo
};