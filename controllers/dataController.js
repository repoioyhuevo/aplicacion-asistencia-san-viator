// controllers/dataController.js
const db = require('../models/db');

exports.getEstudiantes = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.id_estudiante, 
        e.rut, 
        e.nombre, 
        c.nombre_curso,
        c.nivel,
        c.grado
      FROM estudiantes e
      LEFT JOIN cursos c ON e.curso_id = c.id_curso
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener estudiantes:", err);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
};

// ✅ Nueva versión con filtros
exports.getAsistencias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    let query = `
      SELECT 
        e.id_estudiante,
        e.rut,
        e.nombre,
        c.nombre_curso,
        c.nivel,
        c.grado,
        a.fecha,
        a.presente
      FROM asistencias a
      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      LEFT JOIN cursos c ON e.curso_id = c.id_curso
      WHERE 1=1
    `;

    const params = [];

    // 🔸 Filtros dinámicos
    if (fechaInicio && fechaFin) {
      query += ' AND a.fecha BETWEEN ? AND ?';
      params.push(fechaInicio, fechaFin);
    }

    if (nivel && nivel !== 'todos') {
      query += ' AND c.nivel = ?';
      params.push(nivel);
    }

    if (grado && grado !== 'todos') {
      query += ' AND c.grado = ?';
      params.push(grado);
    }

    if (curso && curso !== 'todos') {
      query += ' AND c.nombre_curso = ?';
      params.push(curso);
    }

    query += ' ORDER BY a.fecha ASC';

    const [rows] = await db.query(query, params);

    if (!rows.length) {
      return res.json({ message: 'No se encontraron asistencias con esos filtros.' });
    }

    res.json(rows);

  } catch (err) {
    console.error("❌ Error al obtener asistencias filtradas:", err);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
};
