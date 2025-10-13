const db = require("../models/db");

// ✅ Obtener asistencias con filtros
exports.getAsistencias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    let query = `
      SELECT 
        a.id_asistencia,
        e.id_estudiante,
        e.nombre,
        e.rut,
        e.nivel,
        e.grado,
        c.nombre_curso,
        a.fecha,
        a.hora,
        a.presente,
        a.tipo_registro
      FROM asistencias a
      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      LEFT JOIN cursos c ON e.curso_id = c.id_curso
      WHERE 1=1
        AND DAYOFWEEK(a.fecha) BETWEEN 2 AND 6 -- solo lunes a viernes
    `;
    const params = [];

    if (fechaInicio && fechaFin) {
      query += " AND a.fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    }
    if (nivel && nivel !== "todos") {
      query += " AND e.nivel = ?";
      params.push(nivel);
    }
    if (grado && grado !== "todos") {
      query += " AND e.grado COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${grado}%`);
    }
    if (curso && curso !== "todos") {
      query += " AND c.nombre_curso COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${curso}%`);
    }

    query += " ORDER BY a.fecha ASC, a.hora ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias" });
  }
};

// ✅ Registrar asistencia
exports.registrarAsistencia = async (req, res) => {
  try {
    const { id_estudiante, tipo_registro, presente } = req.body;
    if (!id_estudiante) return res.status(400).json({ error: "Falta id_estudiante" });

    await db.query(
      `INSERT INTO asistencias (id_estudiante, fecha, hora, tipo_registro, presente)
       VALUES (?, CURDATE(), CURTIME(), ?, ?)`,
      [id_estudiante, tipo_registro || "qr", presente ? 1 : 0]
    );

    res.json({ mensaje: "✅ Asistencia registrada correctamente" });
  } catch (err) {
    console.error("❌ Error al registrar asistencia:", err);
    res.status(500).json({ error: "Error al registrar asistencia" });
  }
};

// ✅ Datos para dashboard (gráficos)
exports.getAsistenciasDashboard = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nivel, grado, curso } = req.query;

    let query = `
      SELECT 
        DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
        SUM(CASE WHEN a.presente = 1 THEN 1 ELSE 0 END) AS asistencias,
        SUM(CASE WHEN a.presente = 0 THEN 1 ELSE 0 END) AS faltas
      FROM asistencias a
      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
      LEFT JOIN cursos c ON e.curso_id = c.id_curso
      WHERE DAYOFWEEK(a.fecha) BETWEEN 2 AND 6
    `;
    const params = [];

    if (fechaInicio && fechaFin) {
      query += " AND a.fecha BETWEEN ? AND ?";
      params.push(fechaInicio, fechaFin);
    }
    if (nivel && nivel !== "todos") {
      query += " AND e.nivel = ?";
      params.push(nivel);
    }
    if (grado && grado !== "todos") {
      query += " AND e.grado COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${grado}%`);
    }
    if (curso && curso !== "todos") {
      query += " AND c.nombre_curso COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${curso}%`);
    }

    query += " GROUP BY fecha ORDER BY fecha ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener datos del dashboard:", err);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
};

// ✅ Nueva ruta: obtener solo fechas con registros válidos
exports.getFechasValidas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha
      FROM asistencias
      WHERE DAYOFWEEK(fecha) BETWEEN 2 AND 6
      ORDER BY fecha ASC
    `);
    const fechas = rows.map(r => r.fecha);
    res.json(fechas);
  } catch (err) {
    console.error("❌ Error al obtener fechas válidas:", err);
    res.status(500).json({ error: "Error al obtener fechas válidas" });
  }
};
